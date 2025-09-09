// List files in the shell's /home (IDBFS)

export class ShLsCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute(args) {
    if (!this.terminal.shellWorker) {
      return 'shls: shell is not running. Start it with "sh" first.\r\n';
    }
    const worker = this.terminal.shellWorker;
    const res = await new Promise((resolve) => {
      const onMsg = (ev) => {
        const m = ev.data || {};
        if (m.type === 'fs-list:result') {
          worker.removeEventListener('message', onMsg);
          resolve({ entries: m.entries || [] });
        } else if (m.type === 'error') {
          worker.removeEventListener('message', onMsg);
          resolve({ error: m.message || 'error' });
        }
      };
      worker.addEventListener('message', onMsg);
      worker.postMessage({ type: 'fs-list' });
      setTimeout(() => { try { worker.removeEventListener('message', onMsg); } catch {}; resolve({ error: 'timeout' }); }, 2000);
    });

    if (res.error) return `shls: ${res.error}\r\n`;
    if (!res.entries.length) return '\r\n';
    return res.entries.map((n) => n).join('\r\n') + '\r\n';
  }

  getHelp() {
    return [
      'shls - list files in shell /home (IDBFS)',
      'Usage: shls',
    ].join('\r\n');
  }
}

