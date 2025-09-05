class BootSequence {
  constructor(terminal) {
    this.terminal = terminal;
    this.isSkipped = false;
    this.skipHandler = null;
    this.spinnerFrames = ["-", "\\", "|", "/"];
    this.spinnerIndex = 0;
    this.finalStateShown = false; // Prevent duplicate final state calls
  }

  async run() {
    console.log("Boot sequence starting...");
    this.isSkipped = false;

    // Set up enhanced skip handlers for both desktop and mobile
    this.setupSkipHandlers();

    try {
      // Show skip hint
      await this.writeLine("\x1b[90m// Press Enter to skip\x1b[0m");
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }

      // Login message
      await this.writeLine("Logged in as guest@r3x.sh");
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }

      // Loading animation with spinner
      await this.showLoadingAnimation();
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }

      // Clear screen after loading animation
      this.terminal.clear();

      // Typewriter welcome message with line breaks
      await this.typewriterEffect("Hello, visitor.");
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }
      
      await this.blinkCursorRandom();
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }
      
      this.terminal.write(" "); // Space before next sentence

      await this.typewriterEffect("You are now visiting Rex's personal website.");
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }
      
      await this.blinkCursorRandom();
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }
      
      this.terminal.writeln(""); // New line

      await this.typewriterEffect("Here are some tips to get started:");
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }
      
      await this.blinkCursorRandom();
      if (this.isSkipped) {
        this.handleSkipTransition();
        return;
      }
      
      this.terminal.writeln(""); // New line

      // Add pause before clearing
      await this.randomPause(500, 800);

      // Clear and show final state
      this.showFinalState();
    } finally {
      this.cleanup();
    }
  }


  handleSkipTransition() {
    // This is the ONLY place that handles skip transition
    // Clear everything properly
    
    // Step 1: Reset terminal to clean state
    this.terminal.reset();
    
    // Step 2: Clear screen with ANSI codes
    this.terminal.write('\x1b[2J\x1b[3J\x1b[H');
    
    // Step 3: Use xterm's clear method
    this.terminal.clear();
    
    // Step 4: Show final state
    this.showFinalState();
  }

  showFinalState() {
    // Prevent duplicate calls
    if (this.finalStateShown) return;
    this.finalStateShown = true;
    
    // Don't clear here - assume we're starting from clean state
    // Show only the final state
    const lastLogin = this.getLastLoginTime();
    this.terminal.writeln(`Last login: ${lastLogin}`);
    this.terminal.writeln("Type 'help' to get started");
    this.terminal.writeln(
      "Type 'start' + r3x.sh to be redirected to the normal version",
    );
    this.terminal.writeln("");
  }

  setupSkipHandlers() {
    // Desktop keyboard handler with aggressive event capture to override xterm
    this.skipHandler = (e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault(); // Prevent any default handling
        e.stopImmediatePropagation(); // Stop all other listeners from running
        if (!this.isSkipped) {
          this.isSkipped = true;
          console.log("Skip triggered (keyboard)");
          // Don't do anything else - let the main loop handle the transition
        }
      }
    };
    // Use capture phase and add as early as possible in the event chain
    document.addEventListener("keydown", this.skipHandler, true);
    
    // Also add handler specifically to terminal container for better mobile support
    const terminalContainer = document.getElementById('terminal-container');
    if (terminalContainer) {
      terminalContainer.addEventListener("keydown", this.skipHandler, true);
    }
  }

  cleanup() {
    // Remove event listeners
    if (this.skipHandler) {
      document.removeEventListener("keydown", this.skipHandler, true);
      
      // Also remove from terminal container
      const terminalContainer = document.getElementById('terminal-container');
      if (terminalContainer) {
        terminalContainer.removeEventListener("keydown", this.skipHandler, true);
      }
      
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
    if (this.isSkipped) return;
    
    // Random duration between 1-3 seconds
    const duration = 1000 + Math.random() * 2000;
    const startTime = Date.now();
    const frameDelay = 100; // Update spinner every 100ms

    this.terminal.write("Loading ");

    while (Date.now() - startTime < duration && !this.isSkipped) {
      if (this.isSkipped) return;
      
      // Write spinner frame with backspaces to overwrite previous frame
      this.terminal.write(`[${this.spinnerFrames[this.spinnerIndex]}]`);

      // Update spinner index
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;

      // Wait for next frame
      await this.sleep(frameDelay);

      if (this.isSkipped) return;

      // Backspace 3 chars (for [x]) if not last iteration
      if (Date.now() - startTime < duration && !this.isSkipped) {
        this.terminal.write("\b\b\b");
      }
    }

    // Clear the entire loading line if completed normally
    if (!this.isSkipped) {
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
      if (this.isSkipped) return;
      
      // Show cursor
      this.terminal.write(cursor);
      await this.sleep(blinkDelay);
      
      if (this.isSkipped) {
        // Clean up cursor if skipped
        this.terminal.write("\b ");
        return;
      }

      // Hide cursor (backspace and space)
      this.terminal.write("\b ");
      await this.sleep(blinkDelay);
      
      if (this.isSkipped) return;

      // Move cursor back
      this.terminal.write("\b");
    }
  }

  async typewriterEffect(text) {
    let consecutiveFast = 0; // Track consecutive fast chars for bursts
    let lastWasSpace = false;
    
    for (let i = 0; i < text.length && !this.isSkipped; i++) {
      if (this.isSkipped) return;
      
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
    return new Promise((resolve) => {
      const checkInterval = 50; // Check skip status every 50ms
      let elapsed = 0;
      
      const timer = setInterval(() => {
        elapsed += checkInterval;
        
        if (this.isSkipped || elapsed >= ms) {
          clearInterval(timer);
          resolve();
        }
      }, checkInterval);
    });
  }

  randomPause(min, max) {
    const delay = min + Math.random() * (max - min);
    return this.sleep(delay);
  }
}

export default BootSequence;

