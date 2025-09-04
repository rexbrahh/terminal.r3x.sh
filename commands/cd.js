export class CdCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        const target = args[0] || '/';
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
        const lines = [];
        lines.push('cd - change directory');
        lines.push('Usage: cd [PATH]');
        lines.push('');
        lines.push('Special paths:');
        lines.push('  ~     Go to home directory');
        lines.push('  ..    Go to parent directory');
        lines.push('  .     Stay in current directory');
        lines.push('  /     Go to root directory');
        lines.push('  (no args) Go to root directory');
        lines.push('');
        lines.push('Examples:');
        lines.push('  cd /blog     Change to /blog directory');
        lines.push('  cd ..        Go up one directory');
        lines.push('  cd ~         Go to home directory');
        return lines.join('\r\n');
    }
}