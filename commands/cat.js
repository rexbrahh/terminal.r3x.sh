import { getImprovedRendererRegistry } from '../rendering/improvedInitializeRenderers.js';
import { FilePolicy } from '../policy/FilePolicy.js';

export class CatCommand {
    constructor(terminal) {
        this.terminal = terminal;
        this.rendererRegistry = getImprovedRendererRegistry();
        this.policy = new FilePolicy();
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
                const stat = this.terminal.fs.stat?.(path);
                const analysis = this.policy.analyze({
                    path,
                    mime: stat?.mime_type,
                    size: stat?.size,
                });
                if (!analysis.allowed) {
                    results.push(`cat: ${file}: ${analysis.reason} (${analysis.mime || 'unknown'}) — ${this.policy.suggestForBlock(analysis)}`);
                    continue;
                }
                const content = await this.terminal.fs.getContent(path);

                const metadata = {
                    path: path,
                    size: content.length,
                    type: 'file',
                };

                const renderOptions = {
                    showMetadata: options.showMetadata,
                    colorOutput: !options.noColor,
                    maxWidth: options.maxWidth || 80,
                    lineNumbers: options.lineNumbers,
                };

                try {
                    const rendered = await this.rendererRegistry.render(
                        path,
                        content,
                        metadata,
                        renderOptions,
                    );
                    results.push(rendered);
                } catch (renderError) {
                    console.error('Rendering error:', renderError);
                    results.push(content);
                }
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

        let skipNext = false;
        for (let i = 0; i < args.length; i++) {
            if (skipNext) {
                skipNext = false;
                continue;
            }
            
            const arg = args[i];
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
                    case '--width':
                        // Width option expects next argument
                        if (i + 1 < args.length) {
                            const width = parseInt(args[i + 1]);
                            if (!isNaN(width) && width > 0) {
                                options.maxWidth = width;
                                skipNext = true;
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
        lines.push('  -w, --width WIDTH    Set display width');
        lines.push('');
        lines.push('Note: Only text files within size limits are shown.');
        lines.push('Supported file types with enhanced rendering:');
        lines.push('  • Markdown (.md)     - Rich formatting with marked.js');
        lines.push('  • Code files         - Syntax highlighting with highlight.js');
        lines.push('  • JSON (.json)       - Pretty printing with color coding');
        lines.push('  • CSV/TSV (.csv/.tsv)- Table rendering with PapaParse');
        lines.push('  • YAML (.yml/.yaml)  - Structured display with js-yaml');
        lines.push('  • HTML (.html)       - Terminal-friendly text conversion');
        lines.push('  • Archives (.zip)    - File listing with JSZip');
        lines.push('  • Images             - ASCII art representation');
        lines.push('  • Binary files       - Hex dump visualization');
        lines.push('');
        lines.push('Examples:');
        lines.push('  cat README.md                Display with markdown rendering');
        lines.push('  cat -m data.csv             Show CSV with metadata');
        lines.push('  cat --no-color config.yaml  Display YAML without colors');
        lines.push('  cat -w 60 document.html     Render HTML with 60-char width');
        return lines.join('\r\n');
    }
}
