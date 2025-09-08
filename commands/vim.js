import { FilePolicy } from '../policy/FilePolicy.js';
import { VimOverlay } from '../editor/VimOverlay.js';

export class VimCommand {
  constructor(terminal) {
    this.terminal = terminal;
    this.policy = new FilePolicy();
  }

  async execute(args) {
    if (args.length === 0) return 'vim: missing file operand\r\n';
    const input = args[0];
    const path = this.terminal.fs.resolvePath(this.terminal.currentPath, input);
    const stat = this.terminal.fs.stat?.(path);
    if (!stat) return `vim: ${input}: No such file or directory\r\n`;
    if (stat.isDirectory) return `vim: ${input}: Is a directory\r\n`;
    const analysis = this.policy.analyze({ path, mime: stat.mime_type, size: stat.size });
    if (!analysis.isText) return `vim: ${input}: binary file — ${this.policy.suggestForBlock(analysis)}\r\n`;
    if (analysis.tooLarge) return `vim: ${input}: file exceeds size limit — ${this.policy.suggestForBlock(analysis)}\r\n`;

    const content = await this.terminal.fs.getContent(path) || '';
    const overlay = new VimOverlay({ 
      path, 
      content, 
      readOnly: false,
      api: this.terminal.api,
      preferFallback: true,
      onOpen: () => this.terminal.pauseInput(),
      onClose: () => this.terminal.resumeInput(),
      onSave: async (savePath, text) => {
        // Normalize and write via DBFS
        const norm = this.terminal.fs.normalizePath(savePath);
        // If saving to the original path, include concurrency check
        const opts = {};
        if (norm === path && stat?.updated_at) {
          opts.expectedUpdatedAt = stat.updated_at;
        } else {
          opts.allowCreate = true;
        }
        try {
          await this.terminal.fs.writeFile(norm, text, opts);
        } catch (e) {
          // Surface conflict with a friendlier message
          throw new Error((e?.message || '').includes('conflict') ? 'Save conflict — remote changes detected' : (e?.message || e));
        }
      }
    });
    overlay.open();
    return '';
  }

  getHelp() {
    return [
      'vim - open a file in Vim WASM (editable)',
      'Usage: vim FILE',
      'Save: :w (auto-exports), or Ctrl+S; resolve conflicts with :export /new/path',
    ].join('\r\n');
  }
}
