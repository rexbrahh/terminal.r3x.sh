import { FilePolicy } from '../policy/FilePolicy.js';
import { VimOverlay } from '../editor/VimOverlay.js';

export class ViewCommand {
  constructor(terminal) {
    this.terminal = terminal;
    this.policy = new FilePolicy();
  }

  async execute(args) {
    if (args.length === 0) return 'view: missing file operand\r\n';
    const input = args[0];
    const path = this.terminal.fs.resolvePath(this.terminal.currentPath, input);
    const stat = this.terminal.fs.stat?.(path);
    if (!stat) return `view: ${input}: No such file or directory\r\n`;
    if (stat.isDirectory) return `view: ${input}: Is a directory\r\n`;
    const analysis = this.policy.analyze({ path, mime: stat.mime_type, size: stat.size });
    if (!analysis.isText) return `view: ${input}: binary file — ${this.policy.suggestForBlock(analysis)}\r\n`;
    if (analysis.tooLarge) return `view: ${input}: file exceeds size limit — ${this.policy.suggestForBlock(analysis)}\r\n`;

    const content = await this.terminal.fs.getContent(path) || '';
    const overlay = new VimOverlay({ path, content, readOnly: true, api: this.terminal.api, onSave: async (savePath, text, opts) => {
      // view is read-only; allow Save As to a different path when using fallback editor
      const norm = this.terminal.fs.normalizePath(savePath);
      const same = norm === path;
      if (same) throw new Error('read-only');
      await this.terminal.fs.writeFile(norm, text, { allowCreate: true });
    }});
    overlay.open();
    return '';
  }

  getHelp() {
    return [
      'view - open a file in read-only Vim overlay',
      'Usage: view FILE',
      'Note: falls back to pager if Vim WASM is not configured',
    ].join('\r\n');
  }
}
