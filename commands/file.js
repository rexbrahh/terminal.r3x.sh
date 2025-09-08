import { FilePolicy } from '../policy/FilePolicy.js';

export class FileCommand {
  constructor(terminal) {
    this.terminal = terminal;
    this.policy = new FilePolicy();
  }

  async execute(args) {
    if (args.length === 0) {
      return "file: missing operand\r\nUsage: file <PATH>\r\n";
    }

    const out = [];
    for (const input of args) {
      const path = this.terminal.fs.resolvePath(this.terminal.currentPath, input);
      const stat = this.terminal.fs.stat?.(path);
      if (!stat) {
        out.push(`file: ${input}: No such file or directory`);
        continue;
      }
      if (stat.isDirectory) {
        out.push(`${input}: directory`);
        continue;
      }
      const analysis = this.policy.analyze({
        path,
        mime: stat.mime_type,
        size: stat.size,
      });
      const sizeStr = typeof stat.size === 'number' ? `${stat.size}B` : 'unknown';
      const verdict = analysis.allowed ? 'text' : (analysis.isText ? 'blocked' : 'binary');
      const reason = analysis.allowed ? '' : ` — ${analysis.reason}. ${this.policy.suggestForBlock(analysis)}`;
      out.push(`${input}: ${stat.mime_type}, ${sizeStr}, ${verdict}${reason}`);
    }
    return out.join('\r\n') + '\r\n';
  }

  getHelp() {
    return [
      'file - show file type and policy decision',
      'Usage: file <PATH> [PATH...]',
    ].join('\r\n');
  }
}

