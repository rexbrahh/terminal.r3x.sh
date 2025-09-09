// Copy a file from the site's FS into the shell's /home (IDBFS)

export class ShPutCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute(args) {
    if (!this.terminal.shellWorker) {
      return 'shput: shell is not running. Start it with "sh" first.\r\n';
    }
    if (!args || args.length === 0) {
      return 'shput: missing file operand\r\nUsage: shput <SITE_PATH> [REMOTE_NAME]\r\n';
    }
    const sitePath = this.terminal.fs.resolvePath(this.terminal.currentPath, args[0]);
    const exists = this.terminal.fs.stat?.(sitePath);
    if (!exists || exists.isDirectory) {
      return `shput: ${args[0]}: not a file\r\n`;
    }
    const content = await this.terminal.fs.getContent(sitePath);
    if (content == null) return `shput: ${args[0]}: unable to read\r\n`;
    const remoteName = args[1] || sitePath.split('/').pop();

    const worker = this.terminal.shellWorker;
    worker.postMessage({ type: 'fs-put', name: remoteName, data: String(content) });
    return '';
  }

  getHelp() {
    return [
      'shput - copy a site file into the shell /home',
      'Usage: shput <SITE_PATH> [REMOTE_NAME]',
      'Note: The shell must be running (use sh). Files go to /home/web_user/.',
    ].join('\r\n');
  }
}

