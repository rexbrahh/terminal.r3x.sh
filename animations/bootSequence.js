class BootSequence {
  constructor(terminal) {
    this.terminal = terminal;
    this.isSkipped = false;
    this.skipHandler = null;
    this.spinnerFrames = ["-", "\\", "|", "/"];
    this.spinnerIndex = 0;
  }

  async run() {
    console.log("Boot sequence starting...");
    this.isSkipped = false;

    // Set up skip handler
    this.skipHandler = (e) => {
      if (e.key === "Enter") {
        this.isSkipped = true;
        console.log("Skip triggered");
      }
    };
    document.addEventListener("keydown", this.skipHandler);

    try {
      // Show skip hint
      await this.writeLine("\x1b[90m// Press Enter to skip\x1b[0m");

      if (this.isSkipped) {
        this.showFinalState();
        return;
      }

      // Login message
      await this.writeLine("Logged in as guest@r3x.sh");

      if (this.isSkipped) {
        this.showFinalState();
        return;
      }

      // Loading animation with spinner
      await this.showLoadingAnimation();

      if (this.isSkipped) {
        this.showFinalState();
        return;
      }

      // Typewriter welcome message with line breaks
      await this.typewriterEffect("Hello, visitor.");
      if (!this.isSkipped) {
        await this.blinkCursor(3); // Blink cursor 3 times
        this.terminal.write(" "); // Space before next sentence
      }

      if (this.isSkipped) {
        this.showFinalState();
        return;
      }

      await this.typewriterEffect(
        "You are now visiting Rex's personal website.",
      );
      if (!this.isSkipped) {
        await this.blinkCursor(4); // Blink cursor 4 times
        this.terminal.writeln(""); // New line
      }

      if (this.isSkipped) {
        this.showFinalState();
        return;
      }

      await this.typewriterEffect("Here are some tips to get started:");
      if (!this.isSkipped) {
        await this.blinkCursor(3); // Blink cursor 3 times
        this.terminal.writeln(""); // New line
      }

      if (this.isSkipped) {
        this.showFinalState();
        return;
      }

      // Add pause before clearing
      await this.randomPause(500, 800);

      // Clear and show final state
      this.showFinalState();
    } finally {
      this.cleanup();
    }
  }

  showFinalState() {
    // Clear the terminal
    this.terminal.clear();

    // Show only the final state
    const lastLogin = this.getLastLoginTime();
    this.terminal.writeln(`Last login: ${lastLogin}`);
    this.terminal.writeln("Type 'help' to get started");
    this.terminal.writeln(
      "Type 'start' + r3x.sh to be redirected to the normal version",
    );
    this.terminal.writeln("");
  }

  cleanup() {
    // Remove event listener
    if (this.skipHandler) {
      document.removeEventListener("keydown", this.skipHandler);
      this.skipHandler = null;
    }

    // Update last login time for next visit
    this.updateLastLoginTime();
  }

  async writeLine(text) {
    if (this.isSkipped) return;
    this.terminal.writeln(text);
    // Small delay to make output feel more natural
    await this.sleep(50);
  }

  async showLoadingAnimation() {
    // Random duration between 1-3 seconds
    const duration = 1000 + Math.random() * 2000;
    const startTime = Date.now();
    const frameDelay = 100; // Update spinner every 100ms

    this.terminal.write("Loading ");

    while (Date.now() - startTime < duration && !this.isSkipped) {
      // Write spinner frame with backspaces to overwrite previous frame
      this.terminal.write(`[${this.spinnerFrames[this.spinnerIndex]}]`);

      // Update spinner index
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;

      // Wait for next frame
      await this.sleep(frameDelay);

      // Backspace 3 chars (for [x]) if not last iteration
      if (Date.now() - startTime < duration && !this.isSkipped) {
        this.terminal.write("\b\b\b");
      }
    }

    // Move to next line
    if (!this.isSkipped) {
      this.terminal.writeln("");
    }
  }

  async blinkCursor(times) {
    const cursor = "█";
    const blinkDelay = 250; // 250ms on, 250ms off = 500ms per blink

    for (let i = 0; i < times && !this.isSkipped; i++) {
      // Show cursor
      this.terminal.write(cursor);
      await this.sleep(blinkDelay);

      // Hide cursor (backspace and space)
      this.terminal.write("\b ");
      await this.sleep(blinkDelay);

      // Move cursor back
      this.terminal.write("\b");
    }
  }

  async typewriterEffect(text) {
    for (let i = 0; i < text.length && !this.isSkipped; i++) {
      this.terminal.write(text[i]);

      let delay;

      // Don't add delay after the last character (period pause handled separately)
      if (i === text.length - 1) {
        continue;
      }

      if (text[i] === " ") {
        // Slightly shorter for spaces (60-100ms)
        delay = 60 + Math.random() * 40;
      } else {
        // More variable typing speed for regular characters
        // Sometimes fast bursts (80ms), sometimes slower (180ms)
        const speedVariation = Math.random();
        if (speedVariation < 0.7) {
          // 70% normal speed (80-120ms)
          delay = 80 + Math.random() * 40;
        } else if (speedVariation < 0.9) {
          // 20% faster bursts (50-80ms)
          delay = 50 + Math.random() * 30;
        } else {
          // 10% slower, like thinking (120-180ms)
          delay = 120 + Math.random() * 60;
        }
      }

      await this.sleep(delay);
    }
    // Don't add newline here - let caller handle it
  }

  getLastLoginTime() {
    // Get the stored last login time
    const storedTime = localStorage.getItem("lastLoginTime");

    if (storedTime) {
      // Return the stored time (from previous visit)
      return new Date(parseInt(storedTime)).toLocaleString();
    } else {
      // First visit ever - return current time
      return new Date().toLocaleString();
    }
  }

  updateLastLoginTime() {
    // Store current time for next visit
    localStorage.setItem("lastLoginTime", Date.now().toString());
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  randomPause(min, max) {
    const delay = min + Math.random() * (max - min);
    return this.sleep(delay);
  }
}

export default BootSequence;

