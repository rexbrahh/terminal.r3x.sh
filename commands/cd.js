export class CdCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        const target = args[0] || '/home';
        const newPath = this.terminal.fs.resolvePath(this.terminal.currentPath, target);
        
        if (!this.terminal.fs.exists(newPath)) {
            return `cd: ${target}: No such file or directory\r\n`;
        }
        
        if (!this.terminal.fs.isDirectory(newPath)) {
            return `cd: ${target}: Not a directory\r\n`;
        }
        
        this.terminal.currentPath = newPath;
        return '';
    }

    getHelp() {
        return `cd - change directory
Usage: cd [PATH]

Special paths:
  ~     Go to home directory
  ..    Go to parent directory
  .     Stay in current directory
  /     Go to root directory

Examples:
  cd /blog     Change to /blog directory
  cd ..        Go up one directory
  cd ~         Go to home directory`;
    }
}