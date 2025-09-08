// CodeMirror 6 fallback editor with Vim keybindings
// Loaded when Vim WASM is unavailable/unsupported.

export class CMVimOverlay {
  constructor({ path, content, onSave }) {
    this.path = path;
    this.content = content || '';
    this.onSave = onSave;
    this.container = null;
    this.view = null;
  }

  async open() {
    if (this.container) return;
    this.renderShell();
    try {
      const cm = await this.loadCodeMirror();
      this.view = new cm.EditorView({
        doc: this.content,
        extensions: [
          cm.basicSetup,
          cm.vim(),
          cm.keymap.of([
            {
              key: 'Mod-s',
              preventDefault: true,
              run: () => { this.save(); return true; },
            },
          ]),
        ],
        parent: this.container.querySelector('.cm-editor-host'),
      });
      this.updateStatus(`${this.path} — CM6 (Vim) — Ctrl+S to save, q/Esc to quit`);
      this.container.querySelector('.cm-editor-host').focus();
    } catch (e) {
      this.updateStatus(`Failed to load editor: ${e?.message || e}`);
      // Close self and propagate so caller can fall back to pager
      try { this.close(); } catch {}
      throw e;
    }
  }

  async loadCodeMirror() {
    // Load non-bundled modules so they share a single @codemirror/state instance.
    // Using "?bundle" causes each import to include its own copy of state/view,
    // which breaks instanceof checks inside CodeMirror.
    const [state, view, basic, vimMod] = await Promise.all([
      import('https://esm.sh/@codemirror/state@6'),
      import('https://esm.sh/@codemirror/view@6'),
      import('https://esm.sh/codemirror@6'), // provides basicSetup
      import('https://esm.sh/@replit/codemirror-vim@6.0.1'),
    ]);
    return {
      EditorState: state.EditorState,
      EditorView: view.EditorView,
      keymap: view.keymap,
      basicSetup: basic.basicSetup,
      vim: vimMod.vim,
    };
  }

  updateStatus(text) {
    const el = this.container?.querySelector('.cm-status');
    if (el) el.textContent = text;
  }

  close() {
    if (this.view) this.view.destroy();
    if (this._unsub) { try { this._unsub(); } catch {} this._unsub = null; }
    if (this.container) this.container.remove();
    this.container = null;
    this.view = null;
  }

  async save() {
    try {
      const text = this.view.state.doc.toString();
      this.updateStatus(`Saving ${this.path}…`);
      await this.onSave(this.path, text, { allowCreate: true });
      this.updateStatus(`Saved ${this.path}`);
    } catch (e) {
      this.updateStatus(`Save failed: ${e?.message || e}`);
    }
  }

  renderShell() {
    const div = document.createElement('div');
    div.className = 'cmvim-overlay';
    div.innerHTML = `
      <div class="cm-box">
        <div class="cm-editor-host" tabindex="0"></div>
        <div class="cm-status"></div>
      </div>
    `;
    document.body.appendChild(div);
    this.container = div;
    this.installStyles();
    this.bindKeys();
  }

  bindKeys() {
    const onKey = (e) => {
      if (e.key === 'q' || e.key === 'Escape') { this.close(); e.preventDefault(); }
    };
    document.addEventListener('keydown', onKey, true);
    this._unsub = () => document.removeEventListener('keydown', onKey, true);
  }

  installStyles() {
    if (document.getElementById('cmvim-overlay-style')) return;
    const style = document.createElement('style');
    style.id = 'cmvim-overlay-style';
    style.textContent = `
      .cmvim-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.96); color: #00ff00; z-index: 9999; display: flex; }
      .cm-box { display: grid; grid-template-rows: 1fr auto; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; }
      .cm-editor-host { height: 100%; border: 1px solid #0f0; background: #000; }
      .cm-status { border-top: 1px solid #0f0; margin-top: 6px; padding-top: 4px; color: #80ff80; font-size: 12px; }
    `;
    document.head.appendChild(style);
  }
}
