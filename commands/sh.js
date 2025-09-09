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
    };

    const onResize = () => {
      const c = term.cols || cols;
      const r = term.rows || rows;
      worker.postMessage({ type: 'resize', cols: c, rows: r });
    };

    const onKey = (ev) => {
      // Ctrl+C → SIGINT
      if (ev.ctrlKey && (ev.key === 'c' || ev.key === 'C')) {
        worker.postMessage({ type: 'signal', name: 'SIGINT' });
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
    const disposable = term.onData(onData);
    this._dispose = () => { try { disposable.dispose?.(); } catch {} };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize, true);
    worker.onmessage = onWorkerMessage;

    // Start session
    worker.postMessage({ type: 'start', cols, rows });
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
