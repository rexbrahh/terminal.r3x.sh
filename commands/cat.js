import { RendererRegistry } from '../rendering/RendererRegistry.js';
import { MarkdownRenderer } from '../rendering/renderers/MarkdownRenderer.js';
import { TextRenderer } from '../rendering/renderers/TextRenderer.js';
import { JSONRenderer } from '../rendering/renderers/JSONRenderer.js';
import { ImageRenderer } from '../rendering/renderers/ImageRenderer.js';
import { CodeRenderer } from '../rendering/renderers/CodeRenderer.js';
import { BinaryRenderer } from '../rendering/renderers/BinaryRenderer.js';

export class CatCommand {
    constructor(terminal) {
        this.terminal = terminal;
        this.rendererRegistry = new RendererRegistry();
        this.initializeRenderers();
    }

    /**
     * Initialize and register all available renderers
     */
    initializeRenderers() {
        // Register renderers in order of preference (highest priority first)
        this.rendererRegistry.register(new MarkdownRenderer(), 'markdown');
        this.rendererRegistry.register(new JSONRenderer(), 'json');
        this.rendererRegistry.register(new CodeRenderer(), ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'c', 'css', 'html', 'xml', 'sql', 'shell', 'yaml', 'toml', 'dockerfile', 'makefile']);
        this.rendererRegistry.register(new ImageRenderer(), 'image');
        this.rendererRegistry.register(new BinaryRenderer(), 'binary');
        this.rendererRegistry.register(new TextRenderer(), ['text', 'log', 'ini', 'config', 'unknown']);
    }

    async execute(args) {
        if (args.length === 0) {
            return 'cat: missing file operand\r\n';
        }

        // Parse options
        const options = this.parseOptions(args);
        const files = options.files;
        
        if (files.length === 0) {
            return 'cat: missing file operand\r\n';
        }
        
        const results = [];
        
        for (const file of files) {
            const path = this.terminal.fs.resolvePath(this.terminal.currentPath, file);
            
            if (!this.terminal.fs.exists(path)) {
                results.push(`cat: ${file}: No such file or directory`);
                continue;
            }
            
            if (this.terminal.fs.isDirectory(path)) {
                results.push(`cat: ${file}: Is a directory`);
                continue;
            }
            
            try {
                const content = await this.terminal.fs.getContent(path);
                const metadata = await this.terminal.fs.getMetadata(path);
                
                // Use the rendering system
                const rendered = await this.rendererRegistry.render(
                    file, 
                    content, 
                    metadata, 
                    {
                        showMetadata: options.showMetadata,
                        maxWidth: options.maxWidth || 80,
                        colorOutput: !options.noColor
                    }
                );
                
                results.push(rendered);
            } catch (error) {
                results.push(`cat: ${file}: ${error.message}`);
            }
        }
        
        return results.join('\r\n\r\n') + '\r\n';
    }

    /**
     * Parse command line options
     * @param {string[]} args 
     * @returns {Object}
     */
    parseOptions(args) {
        const options = {
            files: [],
            showMetadata: false,
            maxWidth: null,
            noColor: false,
            lineNumbers: false
        };

        for (const arg of args) {
            if (arg.startsWith('-')) {
                switch (arg) {
                    case '-m':
                    case '--metadata':
                        options.showMetadata = true;
                        break;
                    case '-n':
                    case '--line-numbers':
                        options.lineNumbers = true;
                        break;
                    case '--no-color':
                        options.noColor = true;
                        break;
                    case '-w':
                        // Width option expects next argument
                        const widthIndex = args.indexOf(arg) + 1;
                        if (widthIndex < args.length) {
                            const width = parseInt(args[widthIndex]);
                            if (!isNaN(width) && width > 0) {
                                options.maxWidth = width;
                            }
                        }
                        break;
                    default:
                        // Unknown option, treat as filename
                        options.files.push(arg);
                }
            } else {
                // Regular filename
                options.files.push(arg);
            }
        }

        return options;
    }


    getHelp() {
        const lines = [];
        lines.push('cat - display file contents with enhanced rendering');
        lines.push('Usage: cat [OPTIONS] FILE [FILE...]');
        lines.push('');
        lines.push('Options:');
        lines.push('  -m, --metadata        Show file metadata');
        lines.push('  -n, --line-numbers    Show line numbers');
        lines.push('  --no-color           Disable color output');
        lines.push('  -w WIDTH             Set display width');
        lines.push('');
        lines.push('Supported file types:');
        lines.push('  • Markdown files (.md) - Rich formatting with colors');
        lines.push('  • Code files (.js, .py, .java, .go, .rs, .cpp, .c, .css, .html) - Syntax highlighting');
        lines.push('  • JSON files (.json) - Pretty printing with structure analysis');
        lines.push('  • Image files (.png, .jpg, .gif, .svg) - ASCII art representation');
        lines.push('  • Binary files - Hex dump with file analysis');
        lines.push('  • Text files (.txt, .log, .ini) - Enhanced text display');
        lines.push('');
        lines.push('Examples:');
        lines.push('  cat README.md                 Display with markdown rendering');
        lines.push('  cat -m hello-world.md        Show with metadata');
        lines.push('  cat --no-color file.txt      Display without colors');
        lines.push('  cat -w 60 document.md        Display with 60-char width');
        return lines.join('\r\n');
    }
}