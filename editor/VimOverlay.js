// VimOverlay: attempts to load a Vim WASM engine and display a text buffer
// If the engine is unavailable, falls back to a minimal read-only viewer.
// This is a scaffold for future full integration with vim.wasm or neovim-wasm.

import { LessOverlay } from '../rendering/pager/LessOverlay.js';
import { CMVimOverlay } from './CMVimOverlay.js';
import { SudoOverlay } from './SudoOverlay.js';

export class VimOverlay {
  constructor({ path, content, readOnly = true, onSave = null, api = null }) {
    this.path = path;
    this.content = content || '';
    this.readOnly = !!readOnly;
    this.onSave = onSave;
    this.api = api;
    this.container = null;
    this.canvas = null;
    this.status = null;
    this.loading = true;
    this.closed = false;
    this.engine = null; // placeholder for wasm editor instance
    this.conflict = null;
  }

  async open() {
    if (this.container) return;
    this.renderShell();
    try {
      const compatMsg = await this.checkCompat();
      if (compatMsg) {
        await this.fallbackToCMVim(`Vim.wasm unsupported: ${compatMsg}`);
        return;
      }
      const mod = await import('/vendor/vim-wasm/vimwasm.js');
      if (!mod || (!mod.VimWasm && !mod.default)) {
        await this.fallbackToCMVim('Vim.wasm loader not found');
        return;
      }
      const { VimWasm } = mod;
      if (!VimWasm) {
        await this.fallbackToCMVim('VimWasm class not exported');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.id = 'vim-canvas';
      const input = document.createElement('input');
      input.id = 'vim-input';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.style.position = 'absolute';
      input.style.left = '-10000px';
      this.canvas.replaceWith(canvas);
      this.canvas = canvas;
      this.container.querySelector('.vim-box').appendChild(input);

      // Instantiate VimWasm
      const vim = new VimWasm({
        canvas,
        input,
        workerScriptPath: '/vendor/vim-wasm/vim.js',
      });

      // Wire events
      vim.onVimExit = () => {
        this.close();
      };
      vim.onError = (err) => {
        this.status.textContent = `Error: ${err.message}`;
      };
      vim.onTitleUpdate = (title) => {
        this.status.textContent = `${title}`;
      };

      // Wire export => save bridge
      vim.onFileExport = async (fullpath, bytes) => {
        try {
          const dec = new TextDecoder();
          const text = dec.decode(bytes);
          if (typeof this.onSave === 'function') {
            this.status.textContent = `Saving ${fullpath}…`;
            await this.onSave(fullpath, text);
            this.status.textContent = `Saved ${fullpath}`;
          } else {
            this.status.textContent = 'No save handler configured';
          }
        } catch (e) {
          const msg = String(e?.message || e);
          if (/unauthorized|sudo/i.test(msg)) {
            this.status.textContent = 'sudo required';
            const sudo = new SudoOverlay(this.api, {
              onSuccess: async () => {
                try {
                  await this.onSave(fullpath, text);
                  this.status.textContent = `Saved ${fullpath}`;
                } catch (err) {
                  this.status.textContent = `Save failed: ${err?.message || err}`;
                }
              },
            });
            sudo.open();
          } else if (/conflict/i.test(msg)) {
            this.status.textContent = 'Save conflict — choose an option below';
            this.showConflictDialog({ path: fullpath, text });
          } else {
            this.status.textContent = `Save failed: ${msg}`;
          }
        }
      };

      // Start Vim (read-only via -R when requested)
      const cmdArgs = this.readOnly ? ['-R'] : [];
      vim.start({ cmdArgs, clipboard: true });

      // When not read-only, make :w trigger export automatically
      if (!this.readOnly) {
        const autocmd = 'autocmd BufWritePost * export';
        setTimeout(() => {
          vim.cmdline(autocmd).catch(() => {});
        }, 100);
      }

      // After start, drop the buffer into Vim
      const enc = new TextEncoder();
      const bytes = enc.encode(this.content || '');
      // Provide a sensible filename so modeline shows it
      const name = this.path || 'buffer';
      // small delay to ensure worker is waiting for events
      setTimeout(() => {
        vim.dropFile(name, bytes.buffer).catch((e) => {
          this.status.textContent = `Failed to open file: ${e?.message || e}`;
        });
      }, 0);

      // Focus into Vim
      setTimeout(() => vim.focus(), 50);
      this.engine = vim;
      this.loading = false;
      this.status.textContent = `${this.path} — Vim ${this.readOnly ? '(read-only)' : ''} — q to quit`;
    } catch (e) {
      await this.fallbackToCMVim(`Failed to start Vim: ${e?.message || e}`);
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    document.removeEventListener('keydown', this._onKeyDown, true);
    window.removeEventListener('resize', this._onResize);
    if (this.container) this.container.remove();
    this.container = null;
  }

  // -------- Engine loading (scaffold) --------

  async loadEngineWithTimeout(ms) { /* deprecated path; kept for backward compat */ }

  injectScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  // -------- Placeholder read-only start (unused now) --------
  async startReadOnly() { /* no-op */ }

  fallbackToLess(message) {
    this.close();
    const overlay = new LessOverlay({ title: `${this.path} — ${message}`, content: this.content });
    overlay.open();
  }

  async fallbackToCMVim(message) {
    try {
      // Try CodeMirror Vim fallback first
      const cm = new CMVimOverlay({ path: this.path, content: this.content, onSave: this.onSave });
      cm.open();
    } catch (e) {
      this.fallbackToLess(`${message} — falling back to pager`);
    }
  }

  // -------- Shell and events --------

  renderShell() {
    const div = document.createElement('div');
    div.className = 'vim-overlay';
    div.innerHTML = `
      <div class="vim-box">
        <div class="vim-title">Loading Vim… ${this.escape(this.path)}</div>
        <div class="vim-canvas" tabindex="0"></div>
        <div class="vim-status">Loading engine…</div>
      </div>
    `;
    document.body.appendChild(div);
    this.container = div;
    this.canvas = div.querySelector('.vim-canvas');
    this.status = div.querySelector('.vim-status');
    this.installStyles();
    this.bindEvents();
  }

  bindEvents() {
    this._onKeyDown = (e) => {
      if (!this.container) return;
      // Minimal transport: allow quit with q/Escape even before engine is live
      if (e.key === 'q' || e.key === 'Escape') {
        this.close();
        e.preventDefault();
        return;
      }
      // Ctrl+S to save (maps to :w then :export)
      if ((e.key === 's' || e.key === 'S') && (e.ctrlKey || e.metaKey)) {
        try {
          if (this.engine && typeof this.engine.cmdline === 'function') {
            this.engine.cmdline('write | export').catch(() => {});
          }
        } catch {}
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', this._onKeyDown, true);
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resize() {
    // In a future step, compute grid size for the engine; noop for placeholder
  }

  installStyles() {
    if (document.getElementById('vim-overlay-style')) return;
    const style = document.createElement('style');
    style.id = 'vim-overlay-style';
    style.textContent = `
      .vim-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.96); color: #00ff00; z-index: 9999; display: flex; }
      .vim-box { display: grid; grid-template-rows: auto 1fr auto; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; font-family: Consolas, "Courier New", monospace; }
      .vim-title { color: #80ff80; font-size: 12px; margin-bottom: 6px; }
      .vim-canvas { background: #000; border: 1px solid #0f0; outline: none; overflow: hidden; }
      .vim-status { border-top: 1px solid #0f0; margin-top: 6px; padding-top: 4px; color: #80ff80; font-size: 12px; }
      .vim-fallback-pre { white-space: pre; margin: 0; padding: 6px; height: 100%; overflow: auto; color: #00ff00; background: #000; border: 1px solid #0f0; }
      .vim-conflict { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); background: #001900; color:#d0ffd0; border:1px solid #0f0; padding: 10px; width: 440px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.6); }
      .vim-conflict h3 { margin: 0 0 8px 0; font-size: 14px; color:#80ff80; }
      .vim-conflict .row { margin-top: 6px; display:flex; gap:8px; align-items:center; }
      .vim-conflict input { flex:1; padding:4px 6px; background:#000; color:#d0ffd0; border:1px solid #0f0; font-family: Consolas, "Courier New", monospace; }
      .vim-conflict button { padding:4px 8px; background:#002b00; color:#c8ffc8; border:1px solid #0f0; cursor:pointer; }
      .vim-conflict button:hover { background:#013d01; }
    `;
    document.head.appendChild(style);
  }

  escape(s) { return (s || '').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

  async checkCompat() {
    try {
      const mod = await import('/vendor/vim-wasm/vimwasm.js');
      if (typeof mod.checkBrowserCompatibility === 'function') {
        return mod.checkBrowserCompatibility();
      }
      return undefined;
    } catch (e) {
      return `loader missing: ${e?.message || e}`;
    }
  }

  showConflictDialog({ path, text }) {
    this.closeConflictDialog();
    const box = document.createElement('div');
    box.className = 'vim-conflict';
    const alt = this.suggestAltPath(path);
    box.innerHTML = `
      <h3>Save conflict detected</h3>
      <div>File changed remotely. Choose an action:</div>
      <div class="row">
        <button data-action="overwrite">Overwrite</button>
        <button data-action="saveas">Save As…</button>
        <button data-action="cancel">Cancel</button>
      </div>
      <div class="row" data-saveas style="display:none;">
        <input type="text" value="${this.escape(alt)}" />
        <button data-action="confirm-saveas">Save</button>
      </div>
    `;
    this.container.appendChild(box);
    this.conflict = { node: box, path, text };

    const showSaveAs = () => { box.querySelector('[data-saveas]').style.display = 'flex'; };
    const hide = () => { this.closeConflictDialog(); };
    const onClick = async (ev) => {
      const el = ev.target.closest('button');
      if (!el) return;
      const action = el.getAttribute('data-action');
      if (action === 'cancel') return hide();
      if (action === 'saveas') return showSaveAs();
      if (action === 'overwrite') {
        try {
          await this.onSave(path, text, { force: true });
          this.status.textContent = `Saved (overwritten) ${path}`;
        } catch (e) {
          this.status.textContent = `Save failed: ${e?.message || e}`;
        }
        return hide();
      }
      if (action === 'confirm-saveas') {
        const input = box.querySelector('[data-saveas] input');
        const newPath = input.value.trim();
        if (!newPath) return;
        try {
          await this.onSave(newPath, text, { allowCreate: true });
          this.status.textContent = `Saved as ${newPath}`;
        } catch (e) {
          this.status.textContent = `Save failed: ${e?.message || e}`;
        }
        return hide();
      }
    };
    box.addEventListener('click', onClick);
  }

  closeConflictDialog() {
    if (this.conflict?.node) this.conflict.node.remove();
    this.conflict = null;
  }

  suggestAltPath(p) {
    const ts = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    const parts = (p || '').split('/');
    const name = parts.pop() || 'file';
    const m = name.match(/^(.*?)(\.[^.]*)$/);
    const dir = parts.join('/') || '/';
    const altName = m ? `${m[1]}.LOCAL-${ts}${m[2]}` : `${name}.LOCAL-${ts}`;
    return (dir === '/') ? `/${altName}` : `${dir}/${altName}`;
  }
}
