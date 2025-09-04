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

      // Clear screen after loading animation
      this.terminal.clear();

      // Typewriter welcome message with line breaks
      await this.typewriterEffect("Hello, visitor.");
      if (!this.isSkipped) {
        await this.blinkCursorRandom(); // Random 1-10 blinks
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
        await this.blinkCursorRandom(); // Random 1-10 blinks
        this.terminal.writeln(""); // New line
      }

      if (this.isSkipped) {
        this.showFinalState();
        return;
      }

      await this.typewriterEffect("Here are some tips to get started:");
      if (!this.isSkipped) {
        await this.blinkCursorRandom(); // Random 1-10 blinks
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

    // Clear the entire loading line
    if (!this.isSkipped) {
      // Move cursor to beginning of line and clear it
      this.terminal.write("\r\x1b[K");
    }
  }

  async blinkCursorRandom() {
    // Random number of blinks between 1 and 10
    const times = Math.floor(Math.random() * 10) + 1;
    await this.blinkCursor(times);
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
    let consecutiveFast = 0; // Track consecutive fast chars for bursts
    let lastWasSpace = false;
    
    for (let i = 0; i < text.length && !this.isSkipped; i++) {
      this.terminal.write(text[i]);

      // Don't add delay after the last character
      if (i === text.length - 1) {
        continue;
      }

      let delay;
      const currentChar = text[i];
      const nextChar = text[i + 1] || '';
      const prevChar = text[i - 1] || '';

      // Check for common patterns
      const isCommonPair = this.isCommonLetterPair(currentChar + nextChar);
      const isStartOfWord = lastWasSpace && currentChar !== ' ';
      const isCapital = currentChar >= 'A' && currentChar <= 'Z';
      
      // Occasional mid-word pause (thinking)
      const shouldPauseMidWord = Math.random() < 0.05 && !lastWasSpace && currentChar !== ' ';
      
      if (shouldPauseMidWord) {
        // Occasional thinking pause mid-word
        delay = 200 + Math.random() * 300;
        consecutiveFast = 0;
      } else if (currentChar === ' ') {
        // Space between words
        delay = 40 + Math.random() * 60;
        lastWasSpace = true;
        consecutiveFast = 0;
      } else if (currentChar === ',' || currentChar === '.') {
        // Slight pause after punctuation
        delay = 150 + Math.random() * 100;
        consecutiveFast = 0;
      } else if (isCapital || isStartOfWord) {
        // Slightly slower for capitals and word starts
        delay = 100 + Math.random() * 50;
        consecutiveFast = 0;
        lastWasSpace = false;
      } else if (isCommonPair) {
        // Very fast for common letter pairs
        delay = 30 + Math.random() * 20;
        consecutiveFast++;
      } else if (consecutiveFast > 2 && Math.random() < 0.7) {
        // Continue burst typing
        delay = 40 + Math.random() * 30;
        consecutiveFast++;
      } else {
        // Normal typing with high variation
        const roll = Math.random();
        if (roll < 0.15) {
          // 15% very fast (muscle memory)
          delay = 35 + Math.random() * 25;
          consecutiveFast++;
        } else if (roll < 0.65) {
          // 50% normal speed
          delay = 70 + Math.random() * 50;
          consecutiveFast = 0;
        } else if (roll < 0.90) {
          // 25% slightly slow
          delay = 120 + Math.random() * 40;
          consecutiveFast = 0;
        } else {
          // 10% noticeably slow (thinking/correcting)
          delay = 160 + Math.random() * 80;
          consecutiveFast = 0;
        }
        lastWasSpace = false;
      }

      // Add tiny random variation to all delays
      delay = delay * (0.9 + Math.random() * 0.2);
      
      await this.sleep(delay);
    }
  }

  isCommonLetterPair(pair) {
    const common = ['th', 'he', 'in', 'er', 'an', 're', 'ed', 'on', 'es', 'st', 
                    'en', 'at', 'to', 'nt', 'ha', 'nd', 'ou', 'ea', 'ng', 'as',
                    'or', 'ti', 'is', 'et', 'it', 'ar', 'te', 'se', 'hi', 'of'];
    return common.includes(pair.toLowerCase());
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

