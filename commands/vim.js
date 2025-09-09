import { FilePolicy } from '../policy/FilePolicy.js';
import { VimOverlay } from '../editor/VimOverlay.js';

export class VimCommand {
  constructor(terminal) {
    this.terminal = terminal;
    this.policy = new FilePolicy();
  }

  async execute(args) {
    if (!args || args.length === 0) return 'vim: missing file operand\r\nUsage: vim <FILE>\r\n';

    const input = args[0];
    const path = this.terminal.fs.resolvePath(this.terminal.currentPath, input);
    const stat = this.terminal.fs.stat?.(path);
    if (!stat) return `vim: ${input}: No such file or directory\r\n`;
    if (stat.isDirectory) return `vim: ${input}: Is a directory\r\n`;
    const analysis = this.policy.analyze({ path, mime: stat.mime_type, size: stat.size });
    if (!analysis.isText) return `vim: ${input}: binary file — ${this.policy.suggestForBlock(analysis)}\r\n`;
    if (analysis.tooLarge) return `vim: ${input}: file exceeds size limit — ${this.policy.suggestForBlock(analysis)}\r\n`;

    const content = (await this.terminal.fs.getContent(path)) || '';
    const overlay = new VimOverlay({
      path,
      content,
      readOnly: false,
      // Prefer real Vim by default; CM fallback only if user explicitly sets it
      preferFallback: false,
      api: this.terminal.api,
      onOpen: () => this.terminal.pauseInput(),
      onClose: () => this.terminal.resumeInput(),
      onSave: async (savePath, text) => {
        const norm = this.terminal.fs.normalizePath(savePath);
        const opts = {};
        if (norm === path && stat?.updated_at) opts.expectedUpdatedAt = stat.updated_at;
        else opts.allowCreate = true;
        try {
          await this.terminal.fs.writeFile(norm, text, opts);
        } catch (e) {
          const msg = e?.message || String(e || 'error');
          if (msg.includes('conflict')) throw new Error('Save conflict — remote changes detected');
          throw e;
        }
      },
    });
    overlay.open();
    return '';
  }

  getHelp() {
    return [
      'vim - open a file in Vim WASM (editable)',
      'Usage: vim FILE',
      'Save: :w (auto-exports) or Ctrl+S; conflicts prompt actions',
    ].join('\r\n');
  }
}
