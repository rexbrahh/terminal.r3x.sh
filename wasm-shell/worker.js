/*
  WASM-shell worker scaffold.
  - Tries to load a real WASM shell (/wasm-shell/shell.js). If not found, uses a JS stub.
  - Message types from main: {type:'start'|'stdin'|'resize'|'signal'}
  - Message types to main:   {type:'stdout'|'exit'|'title'|'error'}
*/

(() => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let cols = 80;
  let rows = 24;
  let usingWasm = false;
  const stdinQueue = [];
  let fsReady = false;
  let FS = null;

  function write(text) {
    self.postMessage({ type: 'stdout', data: text });
  }

  // ---------------- Real WASM shell path ----------------
  async function tryStartWasmShell() {
    try {
      importScripts('/wasm-shell/shell.js');
      if (typeof self.ShellModule !== 'function') throw new Error('ShellModule not found');

      const Module = {
        locateFile: (p) => '/wasm-shell/' + p,
        print: (txt) => write(String(txt) + '\n'),
        printErr: (txt) => write('\x1b[31m' + String(txt) + '\x1b[0m\n'),
        onExit: (code) => self.postMessage({ type: 'exit', code }),
        onAbort: (reason) => self.postMessage({ type: 'error', message: String(reason || 'abort') }),
        stdin: () => {
          if (stdinQueue.length === 0) return null; // block until input
          const ch = stdinQueue.shift();
          return ch.charCodeAt(0);
        },
        preRun: [function() {
          try {
            Module.ENV = Module.ENV || {};
            Module.ENV.COLUMNS = String(cols);
            Module.ENV.LINES = String(rows);
            Module.ENV.TERM = 'xterm-256color';
            Module.ENV.HOME = '/home/web_user';
          } catch {}
        }],
        onRuntimeInitialized: function() {
          try {
            FS = Module.FS || self.FS;
            const IDBFS = Module.IDBFS || self.IDBFS;
            if (FS && IDBFS) {
              try { FS.mkdir('/home'); } catch {}
              try { FS.mount(IDBFS, {}, '/home'); } catch {}
              // Populate from IndexedDB, then start shell
              FS.syncfs(true, function(err){
                if (err) write('\x1b[31mIDBFS sync error: ' + (err.message||err) + '\x1b[0m\n');
                fsReady = true;
                startMain();
              });
              return;
            }
          } catch (e) {
            write('\x1b[31mFS init error: ' + (e?.message||e) + '\x1b[0m\n');
          }
          startMain();
        },
      };

      usingWasm = true;
      // Helper to start main when runtime + FS are ready
      function startMain() {
        try {
          write('\x1b[2J\x1b[H');
          write('WASM shell starting...\r\n');
          if (Module.callMain) Module.callMain(['ash']);
          else if (self.Module && self.Module.callMain) self.Module.callMain(['ash']);
        } catch (e) {
          self.postMessage({ type: 'error', message: e?.message || String(e) });
        }
      }

      self.ShellModule(Module).then(() => {
        // onRuntimeInitialized handles startMain after sync
      }).catch((e) => {
        usingWasm = false;
        self.postMessage({ type: 'error', message: 'Failed to init WASM shell: ' + (e?.message || e) });
      });
      return true;
    } catch (e) {
      usingWasm = false;
      try { self.postMessage({ type: 'wasm-status', stage: 'load', message: e?.message || String(e) }); } catch {}
      return false;
    }
  }

  // ---------------- JS stub shell (dev fallback) ----------------
  const state = {
    buffer: '',
    prompt: 'guest@wasm:~$ ',
  };

  function printPrompt() { write(state.prompt); }

  function handleCommand(line) {
    const parts = line.trim().split(/\s+/);
    const cmd = parts[0] || '';
    const args = parts.slice(1);
    switch (cmd) {
      case '': break;
      case 'help':
        write('\r\nBuiltins: help, echo, clear, exit');
        break;
      case 'exit':
        self.postMessage({ type: 'exit', code: 0 });
        return true;
      case 'echo':
        write('\r\n' + args.join(' '));
        break;
      case 'clear':
        write('\x1b[2J\x1b[H');
        break;
      default:
        write(`\r\nsh: command not found: ${cmd}`);
    }
    return false;
  }

  function onStdinJS(data) {
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      if (ch === '\u0003') { // Ctrl+C
        state.buffer = '';
        write('\r\n^C');
        printPrompt();
        continue;
      }
      if (ch === '\r' || ch === '\n') {
        const line = state.buffer;
        state.buffer = '';
        const exit = handleCommand(line);
        if (exit) return;
        write('\r\n');
        printPrompt();
        continue;
      }
      if (ch === '\u007F') { // Backspace
        if (state.buffer.length > 0) {
          state.buffer = state.buffer.slice(0, -1);
          write('\b \b');
        }
        continue;
      }
      if (ch >= ' ' && ch <= '~') {
        state.buffer += ch;
        write(ch);
      }
    }
  }

  async function onStart(msg) {
    cols = msg.cols || cols;
    rows = msg.rows || rows;
    const ok = await tryStartWasmShell();
    if (ok) return; // wasm path will print its own banner
    // Fallback banner
    write('\x1b[2J\x1b[H');
    write('JS stub shell (WASM will replace this)\r\nType \"help\" or \"exit\".\r\n\r\n');
    printPrompt();
  }

  function onStdin(data) {
    if (usingWasm) {
      for (let i = 0; i < data.length; i++) stdinQueue.push(data[i]);
    } else {
      onStdinJS(data);
    }
  }

  function onResize(msg) {
    cols = msg.cols || cols;
    rows = msg.rows || rows;
  }

  function onSignal(msg) {
    if (msg.name === 'SIGINT') {
      if (usingWasm) stdinQueue.push('\u0003');
      else { state.buffer = ''; write('\r\n^C'); printPrompt(); }
    }
  }

  // --------------- File bridge ops (Phase 1) ---------------
  function ensureHome() {
    try { if (FS) { try { FS.mkdir('/home'); } catch {}; try { FS.mkdir('/home/web_user'); } catch {}; } } catch {}
  }

  function onFsPut(msg) {
    if (!usingWasm || !fsReady || !FS) return self.postMessage({ type: 'error', message: 'fs-put failed: FS not ready' });
    try {
      ensureHome();
      const name = (msg.name || 'file.txt').replace(/[^A-Za-z0-9._-]/g, '_');
      const path = '/home/web_user/' + name;
      const data = typeof msg.data === 'string' ? encoder.encode(msg.data) : new Uint8Array(msg.data || []);
      FS.writeFile(path, data);
      // Persist to IDBFS (best effort)
      FS.syncfs(false, function(err){ if (err) write('\x1b[31mIDBFS save error: ' + (err.message||err) + '\x1b[0m\n'); });
      self.postMessage({ type: 'stdout', data: `\r\n[sh] wrote ${path} (${data.length} bytes)` });
    } catch (e) {
      self.postMessage({ type: 'error', message: 'fs-put error: ' + (e?.message||e) });
    }
  }

  function onFsGet(msg) {
    if (!usingWasm || !fsReady || !FS) return self.postMessage({ type: 'error', message: 'fs-get failed: FS not ready' });
    try {
      const name = (msg.name || '').replace(/\.+/g, '.');
      const path = name.startsWith('/') ? name : '/home/web_user/' + name;
      const data = FS.readFile(path);
      self.postMessage({ type: 'fs-get:result', name: path, data }, [data.buffer]);
    } catch (e) {
      self.postMessage({ type: 'error', message: 'fs-get error: ' + (e?.message||e) });
    }
  }

  function onFsList(msg) {
    if (!usingWasm || !fsReady || !FS) return self.postMessage({ type: 'error', message: 'fs-list failed: FS not ready' });
    try {
      ensureHome();
      const ls = FS.readdir('/home/web_user').filter(n => n !== '.' && n !== '..');
      self.postMessage({ type: 'fs-list:result', entries: ls });
    } catch (e) {
      self.postMessage({ type: 'error', message: 'fs-list error: ' + (e?.message||e) });
    }
  }

  self.onmessage = (ev) => {
    const m = ev.data || {};
    try {
      switch (m.type) {
        case 'start': return onStart(m);
        case 'stdin': return onStdin(m.data || '');
        case 'resize': return onResize(m);
        case 'signal': return onSignal(m);
        case 'fs-put': return onFsPut(m);
        case 'fs-get': return onFsGet(m);
        case 'fs-list': return onFsList(m);
        default: return self.postMessage({ type: 'error', message: `unknown msg: ${m.type}` });
      }
    } catch (e) {
      self.postMessage({ type: 'error', message: e?.message || String(e) });
    }
  };
})();
