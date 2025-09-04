export class PwdCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        return this.terminal.currentPath + '\r\n';
    }

    getHelp() {
        const lines = [];
        lines.push('pwd - print working directory');
        lines.push('Usage: pwd');
        lines.push('');
        lines.push('Description:');
        lines.push('  Display the current working directory path.');
        lines.push('');
        lines.push('Example:');
        lines.push('  pwd    Shows current directory (e.g., /home or /blog)');
        return lines.join('\r\n');
    }
}