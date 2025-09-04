export class ClearCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        this.terminal.clear();
        return '';
    }

    getHelp() {
        return `clear - clear the terminal screen
Usage: clear

Description:
  Clear the terminal display, moving cursor to top.
  
Keyboard shortcut:
  Ctrl+L also clears the screen`;
    }
}