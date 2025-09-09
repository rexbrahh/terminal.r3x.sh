import { DatabaseFileSystem } from "./filesystem/DatabaseFileSystem.js";
import { CommandRegistry } from "./commands/registry.js";
import BootSequence from "./animations/bootSequence.js";
import { SupabaseAPI } from "./api/supabase.js";
import { sudoManager } from "./security/SudoManager.js";

class TerminalSite {
  constructor() {
    this.term = null;
    this.fitAddon = null;
    this.api = new SupabaseAPI();
    this.fs = new DatabaseFileSystem(this.api);
    this.commands = new CommandRegistry(this);
    this.currentPath = "/";
    this.commandHistory = [];
    this.historyIndex = -1;
    this.currentLine = "";
    this.cursorPosition = 0;
    this.username = "guest";
    this.hostname = "r3x.sh";
    this.bottomGapRows = 10; // extra blank rows after prompt for scroll comfort
    this.inputPaused = false; // when overlays capture keyboard
  }

  async init() {
    this.term = new Terminal({
      theme: {
        background: "#0c0c0c", // Normal terminal background
        foreground: "#00ff00",
        cursor: "#00ff00",
        selection: "rgba(0, 255, 0, 0.3)",
        black: "#000000",
        red: "#ff0000",
        green: "#00ff00",
        yellow: "#ffff00",
        blue: "#0000ff",
        magenta: "#ff00ff",
        cyan: "#00ffff",
        white: "#ffffff",
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlink: true,
    });

    this.fitAddon = new FitAddon.FitAddon();
    this.term.loadAddon(this.fitAddon);

    const container = document.getElementById("terminal-container");
    this.term.open(container);
    this.fitAddon.fit();

    window.addEventListener("resize", () => {
      this.fitAddon.fit();
    });

    // Initialize filesystem before boot sequence, but don't block UI if it fails
    let fsInitError = null;
    try {
      await this.fs.initialize();
    } catch (e) {
      fsInitError = e;
      console.error('Filesystem initialization failed; continuing without DB', e);
    }
    
    // Run boot sequence instead of displayWelcome
    const bootSequence = new BootSequence(this.term);
    await bootSequence.run();
    
    // Only set up handlers and prompt after boot sequence
    this.setupEventHandlers();
    if (fsInitError) {
      try {
        this.term.writeln('');
        this.term.writeln('\x1b[31mDatabase unavailable. Running with limited filesystem.\x1b[0m');
        this.term.writeln('\x1b[90mCheck CSP and Supabase connectivity in production.\x1b[0m');
      } catch {}
    }
    this.prompt();
  }

  displayWelcome() {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Write each line separately with proper carriage returns
    //this.term.writeln(
    //  "\x1b[32m           ████████                         █████     ",
    //);
    //this.term.writeln("          ███░░░░███                       ░░███      ");
    //this.term.writeln("████████ ░░░    ░███ █████ █████     █████  ░███████  ");
    //this.term.writeln(
    //  "░░███░░███   ██████░ ░░███ ░░███     ███░░   ░███░░███ ",
    //);
    //this.term.writeln(
    //  " ░███ ░░░   ░░░░░░███ ░░░█████░     ░░█████  ░███ ░███ ",
    //);
    //this.term.writeln(
    //  " ░███      ███   ░███  ███░░░███     ░░░░███ ░███ ░███ ",
    //);
    //this.term.writeln(
    //  " █████    ░░████████  █████ █████ ██ ██████  ████ █████",
    //);
    //this.term.writeln(
    // "░░░░░      ░░░░░░░░  ░░░░░ ░░░░░ ░░ ░░░░░░  ░░░░ ░░░░░\x1b[0m",
    //);
    this.term.writeln("");
    //this.term.writeln('Welcome to terminal.r3x.sh v1.0.0');
    this.term.writeln(`Last login: ${dateStr}`);
    this.term.writeln("");
    this.term.writeln("Type 'help' for available commands");
    //this.term.writeln("Type 'ls' to navigate this website");
    this.term.writeln(
      "Type 'start' + r3x.sh to be redirected to the normal version",
    );
  }

  prompt() {
    const path =
      this.currentPath === "/home"
        ? "~"
        : this.currentPath === "/"
          ? "/"
          : this.currentPath;
    const elevated = sudoManager?.isElevated?.() || false;
    const sigil = elevated ? '#' : '$';
    const sigilColor = elevated ? '\x1b[31m' : '';
    const promptStr = `\x1b[32m${this.username}@${this.hostname}\x1b[0m: \x1b[34m${path}\x1b[0m ${sigilColor}${sigil}\x1b[0m `;
    // Ensure viewport sits at bottom and provide a blank line before prompt
    try { this.term.scrollToBottom(); } catch {}
    this.term.writeln("");
    this.term.write(promptStr);
    // Inject a few blank lines after the prompt so users can scroll the prompt upward
    // Save cursor -> write gap -> restore cursor
    if (this.bottomGapRows > 0) {
      try {
        this.term.write("\x1b[s"); // save cursor
        this.term.write("\r\n".repeat(this.bottomGapRows));
        this.term.write("\x1b[u"); // restore cursor
      } catch {}
    }
    this.currentLine = "";
    this.cursorPosition = 0;
  }

  setupEventHandlers() {
    this.term.onData((data) => {
      if (this.inputPaused) return;
      // Log all data for debugging mobile keyboard issues
      console.log('xterm onData received:', JSON.stringify(data), 'charCodes:', [...data].map(c => c.charCodeAt(0)));
      
      switch (data) {
        case "\r": // Enter (carriage return - ASCII 13)
        case "\n": // Enter (line feed - ASCII 10)
        case "\r\n": // Enter (CRLF)
          this.handleCommand();
          break;
        case "\u007F": // Backspace
          this.handleBackspace();
          break;
        case "\u001b[A": // Up arrow
          this.handleHistoryUp();
          break;
        case "\u001b[B": // Down arrow
          this.handleHistoryDown();
          break;
        case "\u001b[D": // Left arrow
          this.handleLeftArrow();
          break;
        case "\u001b[C": // Right arrow
          this.handleRightArrow();
          break;
        case "\u0003": // Ctrl+C
          this.handleCtrlC();
          break;
        case "\t": // Tab
          this.handleTab();
          break;
        default:
          if (data >= " " && data <= "~") {
            this.handleRegularInput(data);
          }
      }
    });
  }

  pauseInput() { this.inputPaused = true; }
  resumeInput() { this.inputPaused = false; }

  handleCommand() {
    // Track when commands are executed for mobile fallback detection
    this.lastCommandTime = Date.now();
    
    if (this.currentLine.trim()) {
      this.commandHistory.push(this.currentLine);
      this.historyIndex = this.commandHistory.length;
    }

    this.term.write("\r\n");

    if (this.currentLine.trim()) {
      this.executeCommand(this.currentLine.trim());
    } else {
      this.prompt();
    }
  }

  async executeCommand(cmdLine) {
    const parts = cmdLine.split(" ");
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      const result = await this.commands.execute(cmd, args);
      if (result) {
        // Split by line and write each line properly
        const lines = result.split("\r\n");
        lines.forEach((line, index) => {
          if (index < lines.length - 1 || line) {
            this.term.writeln(line);
          }
        });
      }
    } catch (error) {
      this.term.writeln(`\x1b[31m${cmd}: command not found\x1b[0m`);
    }

    this.prompt();
  }

  handleBackspace() {
    if (this.cursorPosition > 0) {
      this.currentLine =
        this.currentLine.slice(0, this.cursorPosition - 1) +
        this.currentLine.slice(this.cursorPosition);
      this.cursorPosition--;
      this.term.write("\b \b");

      if (this.cursorPosition < this.currentLine.length) {
        const remaining = this.currentLine.slice(this.cursorPosition);
        this.term.write(remaining + " ");
        this.term.write("\u001b[" + (remaining.length + 1) + "D");
      }
    }
  }

  handleRegularInput(data) {
    this.currentLine =
      this.currentLine.slice(0, this.cursorPosition) +
      data +
      this.currentLine.slice(this.cursorPosition);
    this.cursorPosition++;

    if (this.cursorPosition < this.currentLine.length) {
      const remaining = this.currentLine.slice(this.cursorPosition - 1);
      this.term.write(remaining);
      this.term.write("\u001b[" + (remaining.length - 1) + "D");
    } else {
      this.term.write(data);
    }
  }

  handleHistoryUp() {
    if (this.historyIndex > 0) {
      this.clearCurrentLine();
      this.historyIndex--;
      this.currentLine = this.commandHistory[this.historyIndex];
      this.cursorPosition = this.currentLine.length;
      this.term.write(this.currentLine);
    }
  }

  handleHistoryDown() {
    if (this.historyIndex < this.commandHistory.length - 1) {
      this.clearCurrentLine();
      this.historyIndex++;
      this.currentLine = this.commandHistory[this.historyIndex];
      this.cursorPosition = this.currentLine.length;
      this.term.write(this.currentLine);
    } else if (this.historyIndex === this.commandHistory.length - 1) {
      this.clearCurrentLine();
      this.historyIndex = this.commandHistory.length;
      this.currentLine = "";
      this.cursorPosition = 0;
    }
  }

  handleLeftArrow() {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
      this.term.write("\u001b[D");
    }
  }

  handleRightArrow() {
    if (this.cursorPosition < this.currentLine.length) {
      this.cursorPosition++;
      this.term.write("\u001b[C");
    }
  }

  handleCtrlC() {
    this.term.write("^C\r\n");
    this.currentLine = "";
    this.cursorPosition = 0;
    this.prompt();
  }

  handleTab() {
    const parts = this.currentLine.split(" ");
    const lastPart = parts[parts.length - 1];

    if (parts.length === 1) {
      const suggestions = this.commands.getSuggestions(lastPart);
      this.handleTabComplete(lastPart, suggestions);
    } else {
      const pathSuggestions = this.fs.getPathCompletions(
        lastPart,
        this.currentPath,
      );
      this.handleTabComplete(lastPart, pathSuggestions);
    }
  }

  handleTabComplete(partial, suggestions) {
    if (suggestions.length === 0) return;

    if (suggestions.length === 1) {
      const completion = suggestions[0].substring(partial.length);
      this.currentLine += completion;
      this.cursorPosition += completion.length;
      this.term.write(completion);
    } else {
      this.term.writeln("");
      let lineContent = "";
      suggestions.forEach((s, i) => {
        if (i > 0 && i % 4 === 0) {
          this.term.writeln(lineContent);
          lineContent = "";
        }
        lineContent += s.padEnd(20);
      });
      if (lineContent) {
        this.term.writeln(lineContent);
      }
      this.prompt();
      this.term.write(this.currentLine);
    }
  }

  clearCurrentLine() {
    this.term.write("\r\u001b[K");
    const path = this.currentPath === "/home" ? "~" : this.currentPath;
    const promptStr = `\x1b[32m${this.username}@${this.hostname}\x1b[0m:\x1b[34m${path}\x1b[0m$ `;
    this.term.write(promptStr);
  }

  clear() {
    this.term.clear();
  }

  write(text) {
    this.term.write(text);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const terminal = new TerminalSite();
  await terminal.init();
});
