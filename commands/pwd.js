export class PwdCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        return this.terminal.currentPath + '\r\n';
    }

    getHelp() {
        return `pwd - print working directory
Usage: pwd

Description:
  Display the current working directory path.

Example:
  pwd    Shows current directory (e.g., /home or /blog)`;
    }
}