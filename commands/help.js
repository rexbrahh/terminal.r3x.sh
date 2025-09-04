export class HelpCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        if (args.length > 0) {
            const helpText = this.terminal.commands.getHelp(args[0]);
            if (helpText) {
                return helpText + '\r\n';
            }
            return `help: no help available for '${args[0]}'\r\n`;
        }
        
        return this.getGeneralHelp();
    }

    getGeneralHelp() {
        const commands = this.terminal.commands.getAll();
        let lines = [];
        
        // Header
        lines.push('\x1b[36mterminal.r3x.sh - Unix-style Terminal Interface\x1b[0m');
        lines.push('');
        lines.push('Available Commands:');
        lines.push('─'.repeat(70));
        lines.push('');
        
        // Commands in single column format to avoid width issues
        for (const cmd of commands) {
            const helpText = this.terminal.commands.getHelp(cmd);
            const desc = helpText ? helpText.split('\n')[0].split(' - ')[1] || '' : '';
            const shortDesc = desc.length > 50 ? desc.substring(0, 47) + '...' : desc;
            lines.push(`  \x1b[32m${cmd.padEnd(8)}\x1b[0m${shortDesc}`);
        }
        
        lines.push('');
        lines.push('─'.repeat(70));
        lines.push('');
        lines.push('Navigation Tips:');
        lines.push('  • Use Tab for command/path completion');
        lines.push('  • Use ↑/↓ arrows for command history');
        lines.push('  • Use Ctrl+C to cancel current input');
        lines.push('  • Use Ctrl+L to clear screen');
        lines.push('');
        lines.push('Quick Start:');
        lines.push('  \x1b[32mls\x1b[0m          List current directory');
        lines.push('  \x1b[32mcd /blog\x1b[0m    Navigate to blog');
        lines.push('  \x1b[32mcat about\x1b[0m   Read the about file');
        lines.push('');
        lines.push('For detailed help on a command, type: help [command]');
        lines.push('Example: \x1b[33mhelp ls\x1b[0m');
        lines.push('');
        
        return lines.join('\r\n');
    }

    getHelp() {
        const lines = [];
        lines.push('help - display help information');
        lines.push('Usage: help [COMMAND]');
        lines.push('');
        lines.push('Description:');
        lines.push('  Show general help or help for a specific command.');
        lines.push('');
        lines.push('Examples:');
        lines.push('  help       Show all available commands');
        lines.push('  help ls    Show detailed help for \'ls\' command');
        return lines.join('\r\n');
    }
}