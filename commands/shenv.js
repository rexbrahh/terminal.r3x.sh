// Print the environment variables inside the shell runtime

export class ShEnvCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute() {
    if (!this.terminal.shellWorker) {
      return 'shenv: shell is not running. Start it with "sh" first.\r\n';
    }
    const worker = this.terminal.shellWorker;
    const res = await new Promise((resolve) => {
      const onMsg = (ev) => {
        const m = ev.data || {};
        if (m.type === 'env-get:result') {
          worker.removeEventListener('message', onMsg);
          resolve(m.env || {});
        } else if (m.type === 'error') {
          worker.removeEventListener('message', onMsg);
          resolve({ __error: m.message || 'error' });
        }
      };
      worker.addEventListener('message', onMsg);
      worker.postMessage({ type: 'env-get' });
      setTimeout(() => { try { worker.removeEventListener('message', onMsg); } catch {}; resolve({ __error: 'timeout' }); }, 2000);
    });

    if (res.__error) return `shenv: ${res.__error}\r\n`;
    const lines = Object.keys(res).sort().map((k) => `${k}=${res[k]}`);
    return lines.join('\r\n') + '\r\n';
  }

  getHelp() {
    return [
      'shenv - print environment variables inside the WASM shell',
      'Usage: shenv',
    ].join('\r\n');
  }
}

