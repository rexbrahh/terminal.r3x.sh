export class DownloadCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute(args) {
    if (args.length === 0) {
      return 'download: missing file operand\r\nUsage: download <PATH>\r\n';
    }
    const input = args[0];
    const path = this.terminal.fs.resolvePath(this.terminal.currentPath, input);
    const stat = this.terminal.fs.stat?.(path);
    if (!stat) return `download: ${input}: No such file or directory\r\n`;
    if (stat.isDirectory) return `download: ${input}: Is a directory\r\n`;
    try {
      const content = await this.terminal.fs.getContent(path);
      if (content == null) {
        return `download: ${input}: content not available\r\n`;
      }
      const mime = stat.mime_type || 'text/plain;charset=utf-8';
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.basename(path);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return `Downloading ${input}...\r\n`;
    } catch (e) {
      return `download: ${input}: ${e.message}\r\n`;
    }
  }

  basename(p) {
    const parts = (p || '').split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : 'download';
  }

  getHelp() {
    return [
      'download - download a file to your machine',
      'Usage: download <PATH>',
    ].join('\r\n');
  }
}

