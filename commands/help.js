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
        
        const help = `\x1b[36mterminal.r3x.sh - Unix-style Terminal Interface\x1b[0m
        
Available Commands:
${'─'.repeat(60)}

${commands.map(cmd => {
    const helpText = this.terminal.commands.getHelp(cmd);
    const firstLine = helpText ? helpText.split('\n')[0] : '';
    return `  \x1b[32m${cmd.padEnd(12)}\x1b[0m ${firstLine}`;
}).join('\r\n')}

${'─'.repeat(60)}

Navigation Tips:
  • Use Tab for command/path completion
  • Use ↑/↓ arrows for command history
  • Use Ctrl+C to cancel current input
  • Use Ctrl+L to clear screen

Quick Start:
  \x1b[33mls\x1b[0m          List current directory
  \x1b[33mcd /blog\x1b[0m    Navigate to blog
  \x1b[33mcat about\x1b[0m   Read the about file

For detailed help on a command, type: help [command]
Example: \x1b[33mhelp ls\x1b[0m

\r\n`;
        
        return help;
    }

    getHelp() {
        return `help - display help information
Usage: help [COMMAND]

Description:
  Show general help or help for a specific command.

Examples:
  help       Show all available commands
  help ls    Show detailed help for 'ls' command`;
    }
}