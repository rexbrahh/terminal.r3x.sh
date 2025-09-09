
import { VimWorker, checkBrowserCompatibility } from '../vendor/vim-wasm/vimwasm.js';

function createOverlay(statusText = 'Loading Vim… (downloads assets on first run)') {
  const overlay = document.createElement('div');
  overlay.id = 'vim-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: '#000',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
  });

  const bar = document.createElement('div');
  Object.assign(bar.style, {
    height: '28px',
    background: '#111',
    color: '#8f8',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    borderBottom: '1px solid #222',
  });
  const title = document.createElement('div');
  title.textContent = `Vim (WASM) — ${statusText}`;
  bar.appendChild(title);

  const content = document.createElement('div');
  Object.assign(content.style, { flex: '1 1 auto', position: 'relative' });
  const canvas = window.__vimCanvas || document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  content.appendChild(canvas);

  overlay.appendChild(bar);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Focus canvas for keyboard input
  canvas.setAttribute('tabindex', '0');
  setTimeout(() => canvas.focus(), 0);

  // Close on Escape as a safety valve (Vim will also handle :q)
  const onKey = (e) => {
    if (e.key === 'Escape' && e.metaKey) {
      teardownOverlay();
    }
  };
  overlay.addEventListener('keydown', onKey);

  window.__vimOverlay = overlay;
  return { overlay, canvas, title };
}

function teardownOverlay() {
  const el = window.__vimOverlay;
  if (el && el.parentNode) el.parentNode.removeChild(el);
  window.__vimOverlay = null;
}

export class VimCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute(args) {
    if (!args || args.length === 0) {
      return 'vim: missing file operand\r\nUsage: vim <FILE>\r\n';
    }

    const target = args[0];
    const fs = this.terminal.fs;
    const path = fs.resolvePath(this.terminal.currentPath, target);

    if (fs.exists(path) && fs.isDirectory(path)) {
      return `vim: ${target}: Is a directory\r\n`;
    }

    let content = null;
    if (fs.exists(path)) {
      content = await fs.getContent(path);
      if (content == null) {
        return `vim: ${target}: Unable to read file\r\n`;
      }
    } else {
      // Non-existent file: open a new buffer (ephemeral)
      content = '';
    }
    // Create overlay early so user sees progress
    const { canvas, title } = createOverlay();

    // Environment check: SharedArrayBuffer + cross-origin isolation
    const compatError = checkBrowserCompatibility && checkBrowserCompatibility();
    if (compatError || !('crossOriginIsolated' in window && window.crossOriginIsolated)) {
      const msg = [
        'vim: environment not isolated for WASM runtime.',
        'Required: COOP same-origin + COEP credentialless/require-corp.',
        'Try: npm run dev:isolated (or deploy with _headers).',
        'Fallback: use "editor cm" for CodeMirror-based editor.',
      ].join('\r\n');
      title.textContent = 'Vim (WASM) — requires cross-origin isolation';
      setTimeout(() => teardownOverlay(), 1500);
      return msg + '\r\n';
    }

    title.textContent = 'Vim (WASM) — Starting… (:q to quit)';

    // Canvas setup
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const domW = Math.max(1, Math.floor(rect.width));
    const domH = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.max(1, Math.floor(domW * dpr));
    canvas.height = Math.max(1, Math.floor(domH * dpr));
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    // Simple draw state
    const state = {
      fg: '#c0c0c0',
      bg: '#000000',
      sp: '#ff0000',
      fontName: 'monospace',
      fontSize: 16,
    };
    const applyFont = (bold=false) => {
      const w = bold ? 'bold ' : '';
      ctx.font = `${w}${state.fontSize}px ${state.fontName}`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = state.fg;
    };

    // Wire Vim worker
    let exiting = false;
    const worker = new VimWorker('vendor/vim-wasm/vim.js', async (msg) => {
      switch (msg.kind) {
        case 'started':
          title.textContent = 'Vim (WASM) — running (:q to quit)';
          break;
        case 'title':
          if (msg.title) title.textContent = `Vim (WASM) — ${msg.title}`;
          break;
        case 'exit':
          exiting = true;
          teardownOverlay();
          break;
        case 'error':
          console.error('[vim]', msg.message);
          title.textContent = 'Vim (WASM) — error (see console)';
          break;
        case 'read-clipboard:request':
          try {
            const text = await navigator.clipboard.readText();
            await worker.responseClipboardText(text);
          } catch (e) {
            worker.notifyClipboardError();
          }
          break;
        case 'write-clipboard':
          if (msg.text != null) {
            try { await navigator.clipboard.writeText(msg.text); } catch {}
          }
          break;
        case 'export':
          // File export request from Vim (e.g., :w somefile)
          // We don't persist; just log for now.
          console.log('[vim export]', msg.path, msg.contents);
          break;
        case 'draw': {
          const [op, params] = msg.event || [];
          try {
            switch (op) {
              case 'drawRect': {
                const [x, y, w, h, color, filled] = params;
                if (filled) {
                  ctx.fillStyle = color || state.bg;
                  ctx.fillRect(x, y, w, h);
                } else {
                  ctx.strokeStyle = color || state.fg;
                  ctx.strokeRect(x, y, w, h);
                }
                break;
              }
              case 'drawText': {
                const [text, charHeight, lineHeight, charWidth, x, y, bold, underline, undercurl, strike] = params;
                applyFont(!!bold);
                ctx.fillStyle = state.fg;
                ctx.fillText(text, x, y);
                if (underline) {
                  ctx.strokeStyle = state.fg;
                  ctx.beginPath();
                  ctx.moveTo(x, y + charHeight - 1);
                  ctx.lineTo(x + text.length * charWidth, y + charHeight - 1);
                  ctx.stroke();
                }
                if (strike) {
                  ctx.strokeStyle = state.fg;
                  ctx.beginPath();
                  ctx.moveTo(x, y + charHeight / 2);
                  ctx.lineTo(x + text.length * charWidth, y + charHeight / 2);
                  ctx.stroke();
                }
                break;
              }
              case 'imageScroll': {
                const [x, sy, dy, w, h] = params;
                ctx.drawImage(canvas, x, sy, w, h, x, dy, w, h);
                break;
              }
              case 'invertRect': {
                const [x, y, w, h] = params;
                const img = ctx.getImageData(x, y, w, h);
                const d = img.data;
                for (let i = 0; i < d.length; i += 4) {
                  d[i] = 255 - d[i];
                  d[i+1] = 255 - d[i+1];
                  d[i+2] = 255 - d[i+2];
                }
                ctx.putImageData(img, x, y);
                break;
              }
              case 'setColorBG':
                state.bg = params[0];
                break;
              case 'setColorFG':
                state.fg = params[0];
                break;
              case 'setColorSP':
                state.sp = params[0];
                break;
              case 'setFont': {
                const [name, size] = params;
                state.fontName = name || 'monospace';
                state.fontSize = size || 16;
                break;
              }
              default:
                console.debug('[vim draw] unknown op', op, params);
            }
          } catch (e) {
            console.warn('[vim draw] failed op', op, e);
          }
          break;
        }
        case 'done':
          // event completed; no-op
          break;
        default:
          console.debug('[vim msg]', msg);
      }
    }, (e) => {
      console.error('[vim worker error]', e);
      if (!exiting) title.textContent = 'Vim (WASM) — worker crashed';
    });

    // Keyboard events
    const keyHandler = (e) => {
      e.preventDefault();
      worker.notifyKeyEvent(e.key, e.keyCode || e.which || 0, e.ctrlKey, e.shiftKey, e.altKey, e.metaKey);
    };
    window.__vimOverlay.addEventListener('keydown', keyHandler, { capture: true });

    // Resize handling
    const ro = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      worker.notifyResizeEvent(w, h);
    });
    ro.observe(canvas);

    // Start worker
    const fname = path.split('/').pop();
    const filePath = `/home/web_user/${fname}`;
    const files = {};
    files[filePath] = String(content);
    worker.sendStartMessage({
      kind: 'start',
      buffer: worker.sharedBuffer,
      canvasDomWidth: domW,
      canvasDomHeight: domH,
      perf: false,
      clipboard: true,
      persistent: [],
      dirs: ['/home/web_user'],
      files,
      fetchFiles: [],
      cmdArgs: [filePath],
    });

    return '';
  }

  getHelp() {
    return [
      'vim - open a file in Vim (WASM)',
      'Usage: vim <FILE>',
      'Notes:',
      '  - Use :q to quit. Changes are not persisted to the site backend.',
      '  - Hold Meta+Escape to force-close overlay if needed.',
    ].join('\r\n');
  }
}
