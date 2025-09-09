// Copy a file from the shell's /home to the site's FS

export class ShGetCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute(args) {
    if (!this.terminal.shellWorker) {
      return 'shget: shell is not running. Start it with "sh" first.\r\n';
    }
    if (!args || args.length === 0) {
      return 'shget: missing file operand\r\nUsage: shget <REMOTE_NAME> [SITE_PATH]\r\n';
    }
    const remoteName = args[0];
    const sitePath = args[1] ? this.terminal.fs.resolvePath(this.terminal.currentPath, args[1]) : null;

    const worker = this.terminal.shellWorker;
    const content = await new Promise((resolve, reject) => {
      const onMsg = (ev) => {
        const m = ev.data || {};
        if (m.type === 'fs-get:result') {
          worker.removeEventListener('message', onMsg);
          try {
            const text = new TextDecoder().decode(new Uint8Array(m.data));
            resolve({ name: m.name, text });
          } catch (e) {
            reject(e);
          }
        } else if (m.type === 'error') {
          worker.removeEventListener('message', onMsg);
          reject(new Error(m.message || 'fs error'));
        }
      };
      worker.addEventListener('message', onMsg);
      worker.postMessage({ type: 'fs-get', name: remoteName });
      setTimeout(() => { try { worker.removeEventListener('message', onMsg); } catch {}; reject(new Error('timeout')); }, 3000);
    }).catch((e) => ({ error: e }));

    if (content?.error) {
      return `shget: ${content.error.message || content.error}\r\n`;
    }

    if (!sitePath) {
      // Just print the content to terminal
      return `\r\n----- ${content.name} -----\r\n${content.text}\r\n`;
    }

    try {
      await this.terminal.fs.writeFile(sitePath, content.text, { allowCreate: true });
      return `wrote ${sitePath}\r\n`;
    } catch (e) {
      return `shget: write failed — ${e?.message || e}\r\n`;
    }
  }

  getHelp() {
    return [
      'shget - copy a shell file into the site FS',
      'Usage: shget <REMOTE_NAME> [SITE_PATH]',
      'Notes:',
      '  - If SITE_PATH is omitted, the file contents are printed to the terminal.',
      '  - Shell files are read from /home/web_user/.',
    ].join('\r\n');
  }
}

