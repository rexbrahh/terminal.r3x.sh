// Site control commands bridging shell FS <-> site DatabaseFileSystem

export class SiteCtlCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute(args) {
    if (!args || args.length === 0) return this.getHelp();

    const sub = (args[0] || '').toLowerCase();
    if (sub === 'sync') {
      return await this.syncSiteMount();
    }
    if (sub === 'write') {
      const src = args[1];
      const dst = args[2] || null;
      if (!src) return 'sitectl write: missing SRC path (shell path)\r\n';
      return await this.writeFromShell(src, dst);
    }

    return `sitectl: unknown subcommand '${args[0]}'\r\n` + this.getHelp();
  }

  getHelp() {
    return [
      'sitectl - bridge shell FS with site DB',
      'Usage:',
      '  sitectl sync                       # refresh /site from database',
      '  sitectl write <SRC> [SITE_PATH]    # write shell file back to site DB',
      'Notes:',
      '  - Requires shell running (use sh).',
      '  - When SITE_PATH is omitted and SRC begins with /site, the same path',
      '    is used in the site filesystem (without the /site prefix).',
    ].join('\r\n');
  }

  buildSnapshot() {
    const items = [];
    try {
      const struct = this.terminal.fs.structure;
      if (struct && struct.size) {
        for (const [path, item] of struct.entries()) {
          items.push({
            path,
            type: item.type === 'directory' ? 'directory' : 'file',
            content: item.type === 'file' ? (item.content || '') : undefined,
          });
        }
      }
    } catch (e) {}
    return items;
  }

  async syncSiteMount() {
    const w = this.terminal.shellWorker;
    if (!w) return 'sitectl: shell is not running. Use "sh" first.\r\n';
    const items = this.buildSnapshot();
    try {
      w.postMessage({ type: 'sitefs:snapshot', items });
      return 'Refreshed /site from database snapshot\r\n';
    } catch (e) {
      return `sitectl: sync failed — ${e?.message || e}\r\n`;
    }
  }

  async writeFromShell(src, dest) {
    const w = this.terminal.shellWorker;
    if (!w) return 'sitectl: shell is not running. Use "sh" first.\r\n';
    let sitePath = dest;
    if (!sitePath && src.startsWith('/site/')) sitePath = src.slice('/site'.length) || '/';
    if (!sitePath) return 'sitectl write: missing SITE_PATH (cannot infer)\r\n';

    // Fetch bytes from the shell FS (supports /site and /home paths)
    const content = await new Promise((resolve, reject) => {
      const onMsg = (ev) => {
        const m = ev.data || {};
        if (m.type === 'fs-get:result') {
          try { w.removeEventListener('message', onMsg); } catch {}
          try { const text = new TextDecoder().decode(new Uint8Array(m.data)); resolve(text); } catch (e) { reject(e); }
        } else if (m.type === 'error') {
          try { w.removeEventListener('message', onMsg); } catch {}
          reject(new Error(m.message || 'fs error'));
        }
      };
      w.addEventListener('message', onMsg);
      try { w.postMessage({ type: 'fs-get', name: src }); } catch (e) { try { w.removeEventListener('message', onMsg); } catch {}; reject(e); }
      setTimeout(() => { try { w.removeEventListener('message', onMsg); } catch {}; reject(new Error('timeout')); }, 5000);
    }).catch((e) => ({ __error: e }));

    if (content && content.__error) {
      return `sitectl write: read failed — ${content.__error.message || content.__error}\r\n`;
    }

    // Save to site database
    try {
      const norm = this.terminal.fs.normalizePath(sitePath);
      await this.terminal.fs.writeFile(norm, content, { allowCreate: true });
      return `wrote ${norm}\r\n`;
    } catch (e) {
      const msg = e?.message || e;
      if (/unauthorized|sudo/i.test(String(msg))) return 'sitectl write: unauthorized — run "sudo" first\r\n';
      return `sitectl write: failed — ${msg}\r\n`;
    }
  }
}

