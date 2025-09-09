(function(){
  // Minimal JS-based ShellModule shim to unblock Phase 1.
  // Exposes the Emscripten-style API expected by the worker without a .wasm.
  // Reads keystrokes via Module.stdin(), writes via Module.print/printErr.
  self.ShellModule = function(Module){
    Module = Module || {};

    function safe(fn){ try { return fn && fn(); } catch(_) {} }

    // Kick onRuntimeInitialized asynchronously
    setTimeout(function(){ safe(Module.onRuntimeInitialized); }, 0);

    // Minimal line editor and builtin dispatcher
    Module.callMain = function(argv){
      var print = Module.print || function(){};
      var printErr = Module.printErr || function(s){ print("\x1b[31m" + s + "\x1b[0m\n"); };
      var promptStr = Module.prompt || 'guest@wasm:~$ ';
      var buf = '';
      var running = true;

      function writePrompt(){ print(promptStr); }
      function readChar(){
        try {
          if (typeof Module.stdin === 'function') {
            var code = Module.stdin();
            if (code === null || typeof code === 'undefined') return null;
            return String.fromCharCode(code);
          }
        } catch(_) {}
        return null;
      }
      function builtins(line){
        var parts = line.trim().split(/\s+/);
        var cmd = parts[0] || '';
        var args = parts.slice(1);
        switch(cmd){
          case '': break;
          case 'help':
            print('\nBuiltins: help, echo, clear, exit\n');
            break;
          case 'echo':
            print('\n' + args.join(' ') + '\n');
            break;
          case 'clear':
            print('\x1b[2J\x1b[H');
            break;
          case 'exit':
            running = false;
            safe(function(){ Module.onExit && Module.onExit(0); });
            return true;
          default:
            print('\nsh: command not found: ' + cmd + '\n');
        }
        return false;
      }

      // Banner + prompt
      writePrompt();

      (function loop(){
        if (!running) return;
        var progressed = false, ch;
        while ((ch = readChar()) !== null) {
          progressed = true;
          if (ch === '\r' || ch === '\n') {
            if (builtins(buf)) return; // exit handled
            buf = '';
            print('\n');
            writePrompt();
          } else if (ch === '\u0003') { // Ctrl+C
            buf = '';
            print('\n^C\n');
            writePrompt();
          } else if (ch === '\u007f') { // Backspace
            if (buf.length) { buf = buf.slice(0, -1); print('\b \b'); }
          } else if (ch >= ' ' && ch <= '~') {
            buf += ch; print(ch);
          }
        }
        setTimeout(loop, progressed ? 0 : 30);
      })();
    };

    return Promise.resolve(Module);
  };
})();

