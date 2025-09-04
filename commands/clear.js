export class ClearCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        this.terminal.clear();
        return '';
    }

    getHelp() {
        const lines = [];
        lines.push('clear - clear the terminal screen');
        lines.push('Usage: clear');
        lines.push('');
        lines.push('Description:');
        lines.push('  Clear the terminal display, moving cursor to top.');
        lines.push('');
        lines.push('Keyboard shortcut:');
        lines.push('  Ctrl+L also clears the screen');
        return lines.join('\r\n');
    }
}