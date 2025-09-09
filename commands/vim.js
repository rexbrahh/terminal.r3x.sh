let __vimLoaderPromise = null;

function ensureVimLoaded() {
  if (window.__vimReady) return window.__vimReady;
  if (__vimLoaderPromise) return __vimLoaderPromise;

  __vimLoaderPromise = new Promise((resolve, reject) => {
    // Configure Module so vim.js can find its assets and canvas
    const VENDOR_BASE = (window.__VIM_VENDOR_BASE) || 'vendor/vim-wasm/';
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.id = 'vim-canvas';

    // We attach canvas later when overlay is created; keep a ref
    window.__vimCanvas = canvas;

    window.Module = window.Module || {};
    window.Module.locateFile = (path, prefix) => `${VENDOR_BASE}${path}`;
    // Help some browsers by specifying wasm binary path explicitly
    window.Module.wasmBinaryFile = `${VENDOR_BASE}vim.wasm`;
    window.Module.canvas = canvas;
    window.Module.onRuntimeInitialized = () => {
      window.__vimRuntimeReady = true;
      resolve(window.Module);
    };
    // Optional status hook; we log to console for visibility
    window.Module.setStatus = (msg) => {
      console.debug('[vim] ', msg);
    };

    const script = document.createElement('script');
    script.src = `${VENDOR_BASE}vim.js`;
    script.onload = () => {
      // vim.js will call onRuntimeInitialized when ready
    };
    script.onerror = (e) => reject(new Error('Failed to load Vim (WASM) script'));
    document.head.appendChild(script);
  });

  window.__vimReady = __vimLoaderPromise;
  return __vimLoaderPromise;
}

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

    // Ensure runtime is loaded
    try {
      title.textContent = 'Vim (WASM) — Initializing runtime…';
      await ensureVimLoaded();
      title.textContent = 'Vim (WASM) — Starting… (:q to quit)';
    } catch (e) {
      teardownOverlay();
      return `vim: failed to load Vim (WASM): ${e.message}\r\n`;
    }

    // Mount canvas for Module
    window.Module.canvas = canvas;

    // Prepare in-memory file for Vim to edit
    const fname = path.split('/').pop();
    const mountDir = '/home/web_user';
    const filePath = `${mountDir}/${fname}`;

    try {
      const enc = new TextEncoder();
      const bytes = enc.encode(String(content));
      if (!window.Module.FS_analyzePath(mountDir).exists) {
        window.Module.FS_createPath('/', 'home', true, true);
        window.Module.FS_createPath('/home', 'web_user', true, true);
      }
      // Overwrite if exists
      if (window.Module.FS_analyzePath(filePath).exists) {
        window.Module.FS_unlink(filePath);
      }
      window.Module.FS_createDataFile(mountDir, fname, bytes, true, true);
    } catch (err) {
      teardownOverlay();
      return `vim: failed to prepare buffer: ${err.message}\r\n`;
    }

    // Observe exit to clean overlay and optionally sync content back
    const previousOnExit = window.Module.onExit;
    window.Module.onExit = (status) => {
      try {
        // Read back content (best-effort; non-persistent FS)
        if (window.Module.FS_analyzePath(filePath).exists) {
          const out = window.Module.FS_readFile(filePath, { encoding: 'utf8' });
          // DatabaseFileSystem is read-only; we just print a note
          console.log(`[vim] Edited content length: ${out.length}`);
        }
      } catch (e) {
        console.warn('[vim] Unable to read back file:', e);
      }
      teardownOverlay();
      if (typeof previousOnExit === 'function') previousOnExit(status);
    };

    // Start Vim with the file
    try {
      window.Module.callMain([filePath]);
      return '';
    } catch (e) {
      teardownOverlay();
      return `vim: failed to start: ${e.message}\r\n`;
    }
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
