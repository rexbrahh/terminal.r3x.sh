import { sudoManager } from '../security/SudoManager.js';
import { SudoOverlay } from '../editor/SudoOverlay.js';

export class SudoCommand {
  constructor(terminal) {
    this.terminal = terminal;
  }

  async execute(args) {
    if (args.length === 0 || args[0] === '-s') {
      const overlay = new SudoOverlay(this.terminal.api, {
        onSuccess: () => {
          this.terminal.write('\r\nElevated for a limited time.\r\n');
        },
      });
      overlay.open();
      return '';
    }
    if (args[0] === '-k') {
      sudoManager.clear();
      return 'sudo: credentials cleared\r\n';
    }
    if (args[0] === 'status') {
      const ok = sudoManager.isElevated();
      const until = ok ? new Date(sudoManager.exp).toLocaleTimeString() : 'n/a';
      return `sudo: ${ok ? 'elevated' : 'not elevated'}${ok ? ` (until ${until})` : ''}\r\n`;
    }
    // Optionally: sudo <command> [args...] -> run after prompting
    const cmd = args[0];
    const rest = args.slice(1);
    if (!sudoManager.isElevated()) {
      const overlay = new SudoOverlay(this.terminal.api, {
        onSuccess: async () => {
          const out = await this.terminal.commands.execute(cmd, rest);
          if (out) this.terminal.term.writeln(out);
        },
      });
      overlay.open();
      return '';
    }
    try {
      const out = await this.terminal.commands.execute(cmd, rest);
      return out || '';
    } catch (_) {
      return `sudo: ${cmd}: command not found\r\n`;
    }
  }

  getHelp() {
    return [
      'sudo - run a command with elevated privileges',
      'Usage: sudo [-s|-k|status] [COMMAND [ARGS...]]',
      '  -s        Start a sudo session (prompt for password)',
      '  -k        Revoke sudo credentials',
      '  status    Show sudo state',
      'If COMMAND is provided, it will run after successful authentication.',
    ].join('\r\n');
  }
}

