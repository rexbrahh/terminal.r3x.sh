import { FilePolicy } from '../policy/FilePolicy.js';

export class HeadCommand {
  constructor(terminal) {
    this.terminal = terminal;
    this.policy = new FilePolicy();
  }

  async execute(args) {
    const { count, files, error } = this.parseArgs(args);
    if (error) return error + '\r\n';
    if (files.length === 0) return 'head: missing file operand\r\n';

    const out = [];
    for (const input of files) {
      const path = this.terminal.fs.resolvePath(this.terminal.currentPath, input);
      const stat = this.terminal.fs.stat?.(path);
      if (!stat) { out.push(`head: ${input}: No such file or directory`); continue; }
      if (stat.isDirectory) { out.push(`head: ${input}: Is a directory`); continue; }
      const analysis = this.policy.analyze({ path, mime: stat.mime_type, size: stat.size });
      if (!analysis.isText) {
        out.push(`head: ${input}: binary file — ${this.policy.suggestForBlock(analysis)}`);
        continue;
      }
      try {
        const content = await this.terminal.fs.getContent(path) || '';
        const lines = content.split('\n');
        const headLines = lines.slice(0, count);
        out.push(headLines.join('\r\n'));
      } catch (e) {
        out.push(`head: ${input}: ${e.message}`);
      }
    }
    return out.join('\r\n\r\n') + '\r\n';
  }

  parseArgs(args) {
    let count = 10;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-n' || a === '--lines') {
        const next = args[i + 1];
        const n = parseInt(next, 10);
        if (!isNaN(n) && n >= 0) { count = n; i++; } else { return { count, files, error: 'head: invalid line count' }; }
      } else {
        files.push(a);
      }
    }
    return { count, files };
  }

  getHelp() {
    return [
      'head - output the first part of files',
      'Usage: head [-n N] FILE [FILE...]',
    ].join('\r\n');
  }
}

