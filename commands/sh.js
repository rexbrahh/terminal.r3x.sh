// Interactive shell command that launches a Worker-based PTY.

export class ShCommand {
  constructor(terminal) {
    this.terminal = terminal;
    this._dispose = null;
    this._worker = null;
  }

  async execute(args) {
    const term = this.terminal.term;
    const cols = term.cols || 80;
    const rows = term.rows || 24;
    let inputMirror = '';

    // Pause the app's normal input handling
    this.terminal.pauseInput();

    // Create worker
    const worker = new Worker('/wasm-shell/worker.js', { type: 'classic' });
    this._worker = worker;
    // Expose for future import/export commands
    try { this.terminal.shellWorker = worker; } catch {}

    const onWorkerMessage = (ev) => {
      const m = ev.data || {};
      switch (m.type) {
        case 'wasm-status':
          this.terminal.term.writeln(`\r\n\x1b[33m[sh wasm] ${m.stage}: ${m.message}\x1b[0m`);
          break;
        case 'sitefs:request': {
          // Build a lightweight snapshot of the site filesystem
          const items = [];
          try {
            const struct = this.terminal.fs.structure;
            if (struct && struct.size) {
              for (const [path, item] of struct.entries()) {
                items.push({ path, type: item.type === 'directory' ? 'directory' : 'file', content: item.type === 'file' ? (item.content || '') : undefined });
              }
            }
          } catch (e) {}
          try { this._worker.postMessage({ type: 'sitefs:snapshot', items }); } catch {}
          break;
        }
        case 'stdout':
          term.write(m.data || '');
          break;
        case 'title':
          // ignore for now
          break;
        case 'error':
          term.writeln(`\r\n\x1b[31m[sh error]\x1b[0m ${m.message || 'error'}`);
          break;
        case 'exit':
          cleanup();
          this.terminal.writeln('');
          this.terminal.resumeInput();
          this.terminal.prompt();
          break;
      }
    };

    const onData = (data) => {
      // Forward to worker
      worker.postMessage({ type: 'stdin', data });

      // Maintain a mirror of the current line to detect common exit sequences
      // Ctrl+D (EOT) sent as \u0004
      for (let i = 0; i < data.length; i++) {
        const ch = data[i];
        if (ch === "\u0004") { // Ctrl+D
          inputMirror = '';
          cleanup();
          this.terminal.writeln('');
          this.terminal.resumeInput();
          this.terminal.prompt();
          return;
        }
        if (ch === "\u007F") inputMirror = inputMirror.slice(0, -1);
        else if (ch === "\r" || ch === "\n") {
          const t = inputMirror.trim();
          inputMirror = '';
          if (t === 'exit' || t === 'logout' || t === 'quit') {
            try { worker.postMessage({ type: 'signal', name: 'SIGTERM' }); } catch {}
            cleanup();
            this.terminal.writeln('');
            this.terminal.resumeInput();
            this.terminal.prompt();
            return;
          }
        } else if (ch >= ' ' && ch <= '~') inputMirror += ch;
        else if (ch === "\u0003") inputMirror = '';
      }
    };

    const onResize = () => {
      const c = term.cols || cols;
      const r = term.rows || rows;
      worker.postMessage({ type: 'resize', cols: c, rows: r });
    };

    let suspended = false;
    const restoreAppPrompt = () => {
      try { this.terminal.writeln(''); } catch {}
      this.terminal.resumeInput();
      this.terminal.prompt();
    };

    const wireInput = () => {
      if (this._dispose) { try { this._dispose(); } catch {} }
      const disp = term.onData(onData);
      this._dispose = () => { try { disp.dispose?.(); } catch {} };
    };

    const onKey = (ev) => {
      // Ctrl+C → SIGINT
      if (ev.ctrlKey && (ev.key === 'c' || ev.key === 'C')) {
        worker.postMessage({ type: 'signal', name: 'SIGINT' });
        ev.preventDefault();
        return;
      }
      // Ctrl+D → force exit (EOF)
      if (ev.ctrlKey && (ev.key === 'd' || ev.key === 'D')) {
        inputMirror = '';
        cleanup();
        this.terminal.writeln('');
        this.terminal.resumeInput();
        this.terminal.prompt();
        ev.preventDefault();
        return;
      }
      // Ctrl+] → suspend shell, return to app prompt without killing worker
      if (ev.ctrlKey && ev.key === ']') {
        suspended = !suspended;
        if (suspended) {
          // stop forwarding input
          if (this._dispose) { try { this._dispose(); } catch {} }
          this._dispose = null;
          this.terminal.writeln('\r\n[sh suspended — press Ctrl+] to resume]');
          restoreAppPrompt();
        } else {
          // resume forwarding input to worker
          this.terminal.pauseInput();
          wireInput();
          // redraw a new prompt in the shell
          worker.postMessage({ type: 'stdin', data: '' });
        }
        ev.preventDefault();
      }
    };

    const cleanup = () => {
      try { if (this._dispose) this._dispose(); } catch {}
      try { term.onData(() => {}); } catch {}
      try { window.removeEventListener('keydown', onKey, true); } catch {}
      try { window.removeEventListener('resize', onResize, true); } catch {}
      try { worker.terminate(); } catch {}
      this._worker = null;
      try { delete this.terminal.shellWorker; } catch {}
    };

    // Wire events
    wireInput();
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize, true);
    worker.onmessage = onWorkerMessage;

    // Start session
    worker.postMessage({ type: 'start', cols, rows });
    try { term.writeln('\r\n\x1b[90m[Tip] Ctrl+] to run app commands (sitectl, sudo). Exit with Ctrl+D or type exit.\x1b[0m'); } catch {}
    return '';
  }

  getHelp() {
    return [
      'sh - start an interactive WASM shell (stub)',
      'Usage: sh',
      'Notes:',
      '  - This is a JS stub; BusyBox/WASM will be plugged in next.',
      '  - Ctrl+C sends SIGINT; type exit to leave.',
    ].join('\r\n');
  }
}
