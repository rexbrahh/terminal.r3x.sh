import { LsCommand } from './ls.js';
import { CdCommand } from './cd.js';
import { CatCommand } from './cat.js';
import { PwdCommand } from './pwd.js';
import { ClearCommand } from './clear.js';
import { HelpCommand } from './help.js';
import { StartCommand } from './start.js';
import { FileCommand } from './file.js';
import { HeadCommand } from './head.js';
import { TailCommand } from './tail.js';
import { DownloadCommand } from './download.js';
import { LessCommand } from './less.js';
import { ViewCommand } from './view.js';
import { VimCommand } from './vim.js';
import { SudoCommand } from './sudo.js';

export class CommandRegistry {
    constructor(terminal) {
        this.terminal = terminal;
        this.commands = new Map();
        this.registerBuiltinCommands();
    }

    registerBuiltinCommands() {
        this.register('ls', new LsCommand(this.terminal));
        this.register('cd', new CdCommand(this.terminal));
        this.register('cat', new CatCommand(this.terminal));
        this.register('pwd', new PwdCommand(this.terminal));
        this.register('clear', new ClearCommand(this.terminal));
        this.register('help', new HelpCommand(this.terminal));
        this.register('start', new StartCommand(this.terminal));
        this.register('file', new FileCommand(this.terminal));
        this.register('head', new HeadCommand(this.terminal));
        this.register('tail', new TailCommand(this.terminal));
        this.register('download', new DownloadCommand(this.terminal));
        this.register('less', new LessCommand(this.terminal));
        this.register('view', new ViewCommand(this.terminal));
        this.register('vim', new VimCommand(this.terminal));
        this.register('sudo', new SudoCommand(this.terminal));
        
        // Aliases
        this.register('ll', new LsCommand(this.terminal, { detailed: true }));
        this.register('dir', new LsCommand(this.terminal));
    }

    register(name, command) {
        this.commands.set(name, command);
    }

    async execute(name, args) {
        const command = this.commands.get(name);
        if (!command) {
            throw new Error(`Command not found: ${name}`);
        }
        return await command.execute(args);
    }

    getSuggestions(partial) {
        const suggestions = [];
        for (const [name] of this.commands) {
            if (name.startsWith(partial)) {
                suggestions.push(name);
            }
        }
        return suggestions.sort();
    }

    getAll() {
        return Array.from(this.commands.keys()).sort();
    }

    getHelp(commandName) {
        const command = this.commands.get(commandName);
        return command ? command.getHelp() : null;
    }
}
