# terminal.r3x.sh

A Unix-like terminal interface for web browsing. Navigate the website using familiar command-line tools.

## Quick Start

### Development

```bash
# Using Python (built-in)
python3 -m http.server 8000

# Or using Node.js
npx serve .
```

Then open http://localhost:8000 in your browser.

## Features

- **Unix Commands**: Navigate with `ls`, `cd`, `cat`, `pwd`, `clear`, `help`
- **Tab Completion**: Press Tab to autocomplete commands and paths
- **Command History**: Use arrow keys to navigate through previous commands
- **Markdown Rendering**: Content is beautifully rendered in the terminal
- **Virtual Filesystem**: Complete Unix-style directory structure
- **Responsive Design**: Works on desktop and mobile devices

## Available Commands

| Command | Description |
|---------|-------------|
| `ls` | List directory contents |
| `cd` | Change directory |
| `cat` | Display file contents |
| `pwd` | Print working directory |
| `clear` | Clear terminal screen |
| `help` | Show help information |

## Navigation Tips

- Start with `ls` to see available content
- Use `cd /blog` to navigate to the blog
- Read files with `cat filename`
- Tab completion works for both commands and paths
- Use Ctrl+C to cancel current input

## Project Structure

```
terminal.r3x.sh/
├── index.html          # Main entry point
├── terminal.js         # Core terminal logic
├── filesystem.js       # Virtual filesystem
├── commands/           # Command implementations
├── styles/            # CSS styles
└── content/           # Site content
```

## Technology Stack

- **xterm.js** - Terminal emulation
- **marked** - Markdown rendering
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Terminal styling and effects

## Future Enhancements

- [ ] Search functionality (`grep`)
- [ ] More Unix commands
- [ ] Theme customization
- [ ] Easter eggs
- [ ] Progressive Web App support

## License

MIT