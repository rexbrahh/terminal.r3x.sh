import { BaseRenderer } from '../BaseRenderer.js';

/**
 * Code renderer with comprehensive syntax highlighting for multiple languages
 */
export class CodeRenderer extends BaseRenderer {
    constructor(options = {}) {
        super({
            showLineNumbers: true,
            highlightSyntax: true,
            tabSize: 4,
            wrapLongLines: false,
            showLanguageLabel: true,
            maxLines: 1000,
            ...options
        });

        // Language-specific keyword and pattern definitions
        this.languageConfig = {
            javascript: {
                keywords: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally|throw|class|extends|constructor|super|this|new|typeof|instanceof|in|of|async|await|import|export|from|as|default|static|get|set|delete|void|null|undefined|true|false)\b/g,
                strings: /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
                numbers: /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*([eE][+-]?\d+)?)\b/g,
                operators: /[+\-*/%=!<>&|^~?:]/g,
                brackets: /[(){}[\]]/g
            },
            typescript: {
                keywords: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally|throw|class|extends|constructor|super|this|new|typeof|instanceof|in|of|async|await|import|export|from|as|default|static|get|set|delete|void|null|undefined|true|false|interface|type|enum|namespace|module|declare|abstract|readonly|private|protected|public|implements|keyof|infer)\b/g,
                strings: /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
                numbers: /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*([eE][+-]?\d+)?)\b/g,
                operators: /[+\-*/%=!<>&|^~?:]/g,
                brackets: /[(){}[\]]/g,
                types: /\b[A-Z][a-zA-Z0-9_]*\b/g
            },
            python: {
                keywords: /\b(def|class|import|from|if|elif|else|for|while|with|as|try|except|finally|raise|return|yield|lambda|global|nonlocal|pass|break|continue|and|or|not|in|is|True|False|None)\b/g,
                strings: /('''[\s\S]*?'''|"""[\s\S]*?"""|'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")/g,
                comments: /#.*$/gm,
                numbers: /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*([eE][+-]?\d+)?)\b/g,
                decorators: /@\w+/g,
                operators: /[+\-*/%=!<>&|^~]/g,
                brackets: /[(){}[\]]/g
            },
            java: {
                keywords: /\b(public|private|protected|static|final|abstract|class|interface|extends|implements|import|package|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally|throw|throws|return|new|this|super|null|true|false|void|int|long|short|byte|char|float|double|boolean|String)\b/g,
                strings: /"(?:[^"\\\\]|\\\\.)*"/g,
                comments: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
                numbers: /\b(\d+\.?\d*[fFdD]?|\d+[lL]?|0x[0-9a-fA-F]+)\b/g,
                annotations: /@\w+/g,
                operators: /[+\-*/%=!<>&|^~?:]/g,
                brackets: /[(){}[\]]/g
            },
            go: {
                keywords: /\b(package|import|func|var|const|type|struct|interface|map|chan|if|else|for|range|switch|case|default|break|continue|fallthrough|return|go|defer|select|nil|true|false)\b/g,
                strings: /(`[^`]*`|"(?:[^"\\\\]|\\\\.)*")/g,
                comments: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
                numbers: /\b(0x[0-9a-fA-F]+|0[0-7]+|\d+\.?\d*([eE][+-]?\d+)?)\b/g,
                operators: /[+\-*/%=!<>&|^~:]/g,
                brackets: /[(){}[\]]/g
            },
            rust: {
                keywords: /\b(fn|let|mut|const|static|struct|enum|impl|trait|for|in|while|loop|if|else|match|break|continue|return|pub|use|mod|crate|super|self|Self|where|as|ref|move|Box|Vec|String|str|i8|i16|i32|i64|u8|u16|u32|u64|f32|f64|bool|char|true|false)\b/g,
                strings: /(r#"[^"]*"#|r"[^"]*"|"(?:[^"\\\\]|\\\\.)*")/g,
                comments: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
                numbers: /\b(\d+\.?\d*([eE][+-]?\d+)?[fF]?|\d+[iuIF]\d*|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)\b/g,
                macros: /\w+!/g,
                operators: /[+\-*/%=!<>&|^~?]/g,
                brackets: /[(){}[\]]/g
            },
            cpp: {
                keywords: /\b(auto|bool|break|case|catch|char|class|const|continue|default|delete|do|double|else|enum|explicit|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|nullptr|operator|private|protected|public|register|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|volatile|while)\b/g,
                strings: /(R"\([^)]*\)"|"(?:[^"\\\\]|\\\\.)*")/g,
                comments: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
                numbers: /\b(0x[0-9a-fA-F]+[UuLl]*|0b[01]+[UuLl]*|0[0-7]+[UuLl]*|\d+\.?\d*([eE][+-]?\d+)?[fFlL]?[UuLl]*)\b/g,
                preprocessor: /^\s*#.*$/gm,
                operators: /[+\-*/%=!<>&|^~?]/g,
                brackets: /[(){}[\]]/g
            },
            c: {
                keywords: /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/g,
                strings: /"(?:[^"\\\\]|\\\\.)*"/g,
                comments: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
                numbers: /\b(0x[0-9a-fA-F]+[UuLl]*|0[0-7]+[UuLl]*|\d+\.?\d*([eE][+-]?\d+)?[fFlL]?[UuLl]*)\b/g,
                preprocessor: /^\s*#.*$/gm,
                operators: /[+\-*/%=!<>&|^~?]/g,
                brackets: /[(){}[\]]/g
            },
            css: {
                selectors: /[.#]?[\w-]+(?=\s*\{)/g,
                properties: /[\w-]+(?=\s*:)/g,
                values: /:\s*([^;}]+)/g,
                strings: /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /\/\*[\s\S]*?\*\//g,
                colors: /#[0-9a-fA-F]{3,6}\b|rgb\([^)]*\)|rgba\([^)]*\)|hsl\([^)]*\)|hsla\([^)]*\)/g,
                units: /\b\d+(?:px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax)\b/g
            },
            html: {
                tags: /<\/?[\w-]+(?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/g,
                attributes: /\s([\w-]+)(?==)/g,
                strings: /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /<!--[\s\S]*?-->/g
            },
            json: {
                keys: /"[\w\s-_]+"\s*:/g,
                strings: /:\s*"[^"]*"/g,
                numbers: /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
                booleans: /\b(true|false|null)\b/g,
                brackets: /[{}[\]]/g
            },
            xml: {
                tags: /<\/?[\w:-]+(?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'))?)*\s*\/?>/g,
                attributes: /\s([\w:-]+)(?==)/g,
                strings: /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /<!--[\s\S]*?-->/g,
                cdata: /<!\[CDATA\[[\s\S]*?\]\]>/g
            },
            sql: {
                keywords: /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP|BY|HAVING|ORDER|ASC|DESC|LIMIT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|NOT|NULL|UNIQUE|DEFAULT|AUTO_INCREMENT|VARCHAR|TEXT|INT|INTEGER|BIGINT|FLOAT|DOUBLE|DECIMAL|DATE|DATETIME|TIMESTAMP|BOOLEAN|TRUE|FALSE|AND|OR|IN|LIKE|BETWEEN|IS|DISTINCT|CASE|WHEN|THEN|ELSE|END|UNION|ALL|EXISTS|AS|COUNT|SUM|AVG|MIN|MAX)\b/gi,
                strings: /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /--.*$|\/\*[\s\S]*?\*\//gm,
                numbers: /\b\d+(?:\.\d+)?\b/g,
                operators: /[=<>!+\-*/%]/g,
                brackets: /[()]/g
            },
            shell: {
                commands: /\b(cd|ls|pwd|cat|echo|grep|find|sed|awk|sort|uniq|head|tail|wc|chmod|chown|mkdir|rmdir|rm|cp|mv|tar|gzip|gunzip|zip|unzip|curl|wget|ssh|scp|rsync|git|npm|pip|docker|kubectl|make|gcc|python|node|java|go|rust|cargo)\b/g,
                flags: /\s(-+[\w-]+)/g,
                variables: /\$[\w_]+|\$\{[^}]+\}/g,
                strings: /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /#.*$/gm,
                pipes: /[|&><]/g
            }
        };
    }

    /**
     * Check if this renderer can handle the file type
     * @param {string} fileType 
     * @returns {boolean}
     */
    canRender(fileType) {
        const codeTypes = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'c', 'css', 'html', 'json', 'xml', 'sql', 'shell', 'yaml', 'toml', 'dockerfile', 'makefile'];
        return codeTypes.includes(fileType);
    }

    /**
     * Get renderer priority
     * @returns {number}
     */
    getPriority() {
        return 8; // High priority for code files
    }

    /**
     * Render code content with syntax highlighting
     * @param {string} content 
     * @param {string} filename 
     * @param {Object} metadata 
     * @returns {Promise<string>}
     */
    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('CodeRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename);
        }

        const lines = content.split('\n');
        if (lines.length > this.options.maxLines) {
            return this.renderTooManyLinesWarning(lines.length, filename);
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateCodeMetadata(metadata, filename, this.detectLanguage(filename));
        }

        // Language detection
        const language = this.detectLanguage(filename);
        
        // Language header
        if (this.options.showLanguageLabel && language) {
            output += this.generateLanguageHeader(language, filename);
        }

        // Render code with syntax highlighting
        output += this.renderCodeWithHighlighting(content, language);

        return output;
    }

    /**
     * Detect programming language from filename
     * @param {string} filename 
     * @returns {string}
     */
    detectLanguage(filename) {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const extensionMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'mjs': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'pyw': 'python',
            'java': 'java',
            'go': 'go',
            'rs': 'rust',
            'cpp': 'cpp',
            'cxx': 'cpp',
            'cc': 'cpp',
            'c': 'c',
            'h': 'c',
            'hpp': 'cpp',
            'css': 'css',
            'scss': 'css',
            'sass': 'css',
            'less': 'css',
            'html': 'html',
            'htm': 'html',
            'xml': 'xml',
            'json': 'json',
            'sql': 'sql',
            'sh': 'shell',
            'bash': 'shell',
            'zsh': 'shell',
            'fish': 'shell',
            'ps1': 'shell',
            'yml': 'yaml',
            'yaml': 'yaml',
            'toml': 'toml',
            'dockerfile': 'dockerfile',
            'makefile': 'makefile'
        };

        // Check filename patterns
        if (filename.toLowerCase() === 'dockerfile') return 'dockerfile';
        if (filename.toLowerCase() === 'makefile') return 'makefile';
        
        return extensionMap[ext] || 'text';
    }

    /**
     * Generate language header
     * @param {string} language 
     * @param {string} filename 
     * @returns {string}
     */
    generateLanguageHeader(language, filename) {
        const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);
        const icon = this.getLanguageIcon(language);
        
        let output = '';
        output += this.colorize(`${icon} ${langDisplay} Source Code`, '1') + '\n';
        output += this.colorize('File: ', '36') + filename + '\n';
        output += this.createSeparator('─', 60) + '\n';
        
        return output;
    }

    /**
     * Get icon for language
     * @param {string} language 
     * @returns {string}
     */
    getLanguageIcon(language) {
        const icons = {
            'javascript': '🟨',
            'typescript': '🔷',
            'python': '🐍',
            'java': '☕',
            'go': '🐹',
            'rust': '🦀',
            'cpp': '⚡',
            'c': '🔧',
            'css': '🎨',
            'html': '🌐',
            'json': '📋',
            'xml': '📄',
            'sql': '🗄️',
            'shell': '🐚',
            'yaml': '⚙️',
            'dockerfile': '🐳',
            'makefile': '🔨'
        };
        
        return icons[language] || '📝';
    }

    /**
     * Render code with syntax highlighting
     * @param {string} content 
     * @param {string} language 
     * @returns {string}
     */
    renderCodeWithHighlighting(content, language) {
        const lines = content.split('\n');
        let output = '';
        
        const lineNumberWidth = this.options.showLineNumbers ? 
            Math.max(3, String(lines.length).length + 1) : 0;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Apply syntax highlighting
            if (this.options.highlightSyntax && this.languageConfig[language]) {
                line = this.applySyntaxHighlighting(line, language);
            }

            // Add line numbers
            if (this.options.showLineNumbers) {
                const lineNum = String(i + 1).padStart(lineNumberWidth - 1, ' ');
                output += this.colorize(lineNum + '│', '90') + ' ';
            }

            // Handle tabs
            if (line.includes('\t')) {
                line = line.replace(/\t/g, ' '.repeat(this.options.tabSize));
            }

            // Wrap long lines if enabled
            if (this.options.wrapLongLines && this.getDisplayLength(line) > this.options.maxWidth) {
                const wrapped = this.wrapCodeLine(line, this.options.maxWidth - lineNumberWidth - 2);
                for (let j = 0; j < wrapped.length; j++) {
                    if (j > 0 && this.options.showLineNumbers) {
                        output += this.colorize(' '.repeat(lineNumberWidth) + '│', '90') + ' ';
                    }
                    output += wrapped[j] + '\n';
                }
            } else {
                output += line + '\n';
            }
        }

        return output.slice(0, -1); // Remove last newline
    }

    /**
     * Apply syntax highlighting to a line
     * @param {string} line 
     * @param {string} language 
     * @returns {string}
     */
    applySyntaxHighlighting(line, language) {
        const config = this.languageConfig[language];
        if (!config) return line;

        let highlighted = line;
        const replacements = [];

        // Collect all matches with their positions
        for (const [type, pattern] of Object.entries(config)) {
            let match;
            while ((match = pattern.exec(line)) !== null) {
                replacements.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    type: type
                });
            }
        }

        // Sort by position (descending) to avoid offset issues
        replacements.sort((a, b) => b.start - a.start);

        // Apply highlighting
        for (const replacement of replacements) {
            const color = this.getColorForType(replacement.type);
            const colorized = this.colorize(replacement.text, color);
            highlighted = highlighted.substring(0, replacement.start) + 
                         colorized + 
                         highlighted.substring(replacement.end);
        }

        return highlighted;
    }

    /**
     * Get color code for syntax element type
     * @param {string} type 
     * @returns {string}
     */
    getColorForType(type) {
        const colors = {
            'keywords': '35',      // Magenta
            'strings': '32',       // Green
            'comments': '90',      // Gray
            'numbers': '33',       // Yellow
            'operators': '37',     // White
            'brackets': '37',      // White
            'types': '36',         // Cyan
            'decorators': '93',    // Bright Yellow
            'annotations': '93',   // Bright Yellow
            'macros': '31',        // Red
            'preprocessor': '95',  // Bright Magenta
            'selectors': '36',     // Cyan
            'properties': '34',    // Blue
            'values': '32',        // Green
            'colors': '33',        // Yellow
            'units': '33',         // Yellow
            'tags': '31',          // Red
            'attributes': '36',    // Cyan
            'keys': '36',          // Cyan
            'booleans': '35',      // Magenta
            'cdata': '90',         // Gray
            'commands': '32',      // Green
            'flags': '33',         // Yellow
            'variables': '36',     // Cyan
            'pipes': '37'          // White
        };
        
        return colors[type] || '37';
    }

    /**
     * Wrap a code line preserving indentation
     * @param {string} line 
     * @param {number} width 
     * @returns {string[]}
     */
    wrapCodeLine(line, width) {
        // Don't wrap if line is short enough
        if (this.getDisplayLength(line) <= width) {
            return [line];
        }

        // Extract leading whitespace
        const leadingWhitespace = line.match(/^\s*/)[0];
        const content = line.slice(leadingWhitespace.length);
        
        // If even the content without indentation is too long, hard wrap
        if (this.getDisplayLength(content) > width - leadingWhitespace.length) {
            const wrapped = [];
            let remaining = line;
            
            while (this.getDisplayLength(remaining) > width) {
                // Find a good break point (preferably at a space or operator)
                let breakPoint = width;
                for (let i = width - 1; i > width * 0.7; i--) {
                    if (/[\s\(\)\[\]\{\},;]/.test(remaining[i])) {
                        breakPoint = i + 1;
                        break;
                    }
                }
                
                wrapped.push(remaining.slice(0, breakPoint));
                remaining = leadingWhitespace + '  ' + remaining.slice(breakPoint).trim();
            }
            
            if (remaining.trim()) {
                wrapped.push(remaining);
            }
            
            return wrapped;
        }
        
        return [line];
    }

    /**
     * Get display length excluding ANSI codes
     * @param {string} text 
     * @returns {number}
     */
    getDisplayLength(text) {
        return text.replace(/\x1b\[[0-9;]*m/g, '').length;
    }

    /**
     * Generate code metadata
     * @param {Object} metadata 
     * @param {string} filename 
     * @param {string} language 
     * @returns {string}
     */
    generateCodeMetadata(metadata, filename, language) {
        let output = '';
        
        output += this.colorize('File:', '36') + ' ' + filename + '\n';
        output += this.colorize('Language:', '36') + ' ' + (language.charAt(0).toUpperCase() + language.slice(1)) + '\n';
        
        if (metadata.size) {
            output += this.colorize('Size:', '36') + ' ' + this.formatFileSize(metadata.size) + '\n';
        }
        
        if (metadata.modified) {
            output += this.colorize('Modified:', '36') + ' ' + new Date(metadata.modified).toLocaleString() + '\n';
        }
        
        // Code statistics
        const stats = this.analyzeCodeStructure(content);
        output += this.colorize('Lines:', '36') + ' ' + stats.lines + '\n';
        
        if (stats.comments > 0) {
            output += this.colorize('Comments:', '36') + ' ' + stats.comments + '\n';
        }
        
        output += this.createSeparator() + '\n';
        
        return output;
    }

    /**
     * Analyze code structure for statistics
     * @param {string} content 
     * @returns {Object}
     */
    analyzeCodeStructure(content) {
        const lines = content.split('\n');
        let comments = 0;
        let emptyLines = 0;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') {
                emptyLines++;
            } else if (trimmed.startsWith('//') || trimmed.startsWith('#') || 
                      trimmed.startsWith('/*') || trimmed.startsWith('<!--')) {
                comments++;
            }
        }
        
        return {
            lines: lines.length,
            comments: comments,
            emptyLines: emptyLines,
            codeLines: lines.length - comments - emptyLines
        };
    }

    /**
     * Render warning for large files
     * @param {number} size 
     * @param {string} filename 
     * @returns {string}
     */
    renderLargeFileWarning(size, filename) {
        return this.colorize('⚠ Code file too large for syntax highlighting', '33') + '\n' +
               `File: ${filename}\n` +
               `Size: ${this.formatFileSize(size)}\n` +
               `Limit: ${this.formatFileSize(1024 * 1024)}\n\n` +
               this.colorize('Use a code editor for large files.', '90');
    }

    /**
     * Render warning for files with too many lines
     * @param {number} lineCount 
     * @param {string} filename 
     * @returns {string}
     */
    renderTooManyLinesWarning(lineCount, filename) {
        return this.colorize('⚠ Code file has too many lines for terminal display', '33') + '\n' +
               `File: ${filename}\n` +
               `Lines: ${lineCount}\n` +
               `Limit: ${this.options.maxLines} lines\n\n` +
               this.colorize('Use a code editor for files with many lines.', '90');
    }
}