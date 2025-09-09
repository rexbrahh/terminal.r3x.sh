import { FilePolicy } from '../policy/FilePolicy.js';
import { LessOverlay } from '../rendering/pager/LessOverlay.js';

export class LessCommand {
  constructor(terminal) {
    this.terminal = terminal;
    this.policy = new FilePolicy();
  }

  async execute(args) {
    if (args.length === 0) {
      return 'less: missing file operand\r\n';
    }
    const input = args[0];
    const path = this.terminal.fs.resolvePath(this.terminal.currentPath, input);
    const stat = this.terminal.fs.stat?.(path);
    if (!stat) return `less: ${input}: No such file or directory\r\n`;
    if (stat.isDirectory) return `less: ${input}: Is a directory\r\n`;

    const analysis = this.policy.analyze({ path, mime: stat.mime_type, size: stat.size });
    if (!analysis.isText) {
      return `less: ${input}: binary file — ${this.policy.suggestForBlock(analysis)}\r\n`;
    }
    if (analysis.tooLarge) {
      return `less: ${input}: file exceeds size limit — ${this.policy.suggestForBlock(analysis)}\r\n`;
    }

    const content = await this.terminal.fs.getContent(path) || '';
    const overlay = new LessOverlay({ title: `${path}`, content });
    overlay.onClose = () => {
      // no-op; returns to terminal
    };
    overlay.open();
    return '';
  }

  getHelp() {
    return [
      'less - view text files in a pager',
      'Usage: less FILE',
      'Keys: q quit, / find, n/N next/prev, g/G top/bottom, :N goto, w wrap',
    ].join('\r\n');
  }
}

