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
        
        // Build command list with proper formatting
        const commandList = [];
        for (const cmd of commands) {
            const helpText = this.terminal.commands.getHelp(cmd);
            const desc = helpText ? helpText.split('\n')[0].split(' - ')[1] || '' : '';
            // Truncate description if too long
            const shortDesc = desc.length > 30 ? desc.substring(0, 27) + '...' : desc;
            commandList.push({ name: cmd, description: shortDesc });
        }
        
        // Format commands in columns
        const leftColumn = [];
        const rightColumn = [];
        for (let i = 0; i < commandList.length; i++) {
            if (i % 2 === 0) {
                leftColumn.push(commandList[i]);
            } else {
                rightColumn.push(commandList[i]);
            }
        }
        
        // Build the formatted output
        let commandSection = '';
        for (let i = 0; i < leftColumn.length; i++) {
            const left = leftColumn[i];
            const right = rightColumn[i];
            
            let line = `  \x1b[32m${left.name.padEnd(6)}\x1b[0m  ${left.description.padEnd(32)}`;
            if (right) {
                line += `  \x1b[32m${right.name.padEnd(6)}\x1b[0m  ${right.description}`;
            }
            commandSection += line + '\r\n';
        }
        
        const help = `\x1b[36mterminal.r3x.sh - Unix-style Terminal Interface\x1b[0m

                        Available Commands:
────────────────────────────────────────────────────────────────────────────────

${commandSection}
────────────────────────────────────────────────────────────────────────────────

Navigation Tips:
  • Use Tab for command/path completion
  • Use ↑/↓ arrows for command history
  • Use Ctrl+C to cancel current input
  • Use Ctrl+L to clear screen

Quick Start:
  \x1b[32mls\x1b[0m          List current directory
  \x1b[32mcd /blog\x1b[0m    Navigate to blog
  \x1b[32mcat about\x1b[0m   Read the about file

For detailed help on a command, type: help [command]
Example: \x1b[33mhelp ls\x1b[0m
`;
        
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