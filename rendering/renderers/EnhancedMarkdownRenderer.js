import { BaseRenderer } from '../BaseRenderer.js';

/**
 * Enhanced Markdown renderer using marked.js library
 * Provides better parsing and more accurate rendering
 */
export class EnhancedMarkdownRenderer extends BaseRenderer {
    constructor(options = {}) {
        super(options);
        this.setupMarkedRenderer();
    }

    canRender(fileType) {
        return fileType === 'markdown';
    }

    getPriority() {
        return 20; // Higher priority than basic MarkdownRenderer
    }

    setupMarkedRenderer() {
        if (typeof marked === 'undefined') {
            console.warn('marked.js not loaded, falling back to basic renderer');
            return;
        }

        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            tables: true,
            sanitize: false,
            smartLists: true,
            smartypants: true
        });

        // Custom renderer for terminal output
        this.markedRenderer = new marked.Renderer();
        
        // Headers
        this.markedRenderer.heading = (text, level) => {
            const colors = ['36', '32', '33', '35', '34', '37'];
            const color = colors[Math.min(level - 1, colors.length - 1)];
            const prefix = '#'.repeat(level);
            return `\x1b[${color}m${prefix} ${text}\x1b[0m\n\n`;
        };

        // Code blocks
        this.markedRenderer.code = (code, language) => {
            return this.renderCodeBlock(code, language) + '\n';
        };

        // Inline code
        this.markedRenderer.codespan = (code) => {
            return `\x1b[93m${code}\x1b[0m`;
        };

        // Links
        this.markedRenderer.link = (href, title, text) => {
            return `${text} \x1b[34m(${href})\x1b[0m`;
        };

        // Bold
        this.markedRenderer.strong = (text) => {
            return `\x1b[1m${text}\x1b[0m`;
        };

        // Italic
        this.markedRenderer.em = (text) => {
            return `\x1b[2m${text}\x1b[0m`;
        };

        // Strikethrough
        this.markedRenderer.del = (text) => {
            return `\x1b[9m${text}\x1b[0m`;
        };

        // Lists
        this.markedRenderer.list = (body, ordered, start) => {
            return body + '\n';
        };

        this.markedRenderer.listitem = (text, task, checked) => {
            if (task) {
                const checkbox = checked ? '[✓]' : '[ ]';
                return `  ${checkbox} ${text}\n`;
            }
            return `  • ${text}\n`;
        };

        // Blockquotes
        this.markedRenderer.blockquote = (quote) => {
            const lines = quote.split('\n').filter(line => line.trim());
            return lines.map(line => `\x1b[90m│\x1b[0m \x1b[37m${line}\x1b[0m`).join('\n') + '\n\n';
        };

        // Horizontal rule
        this.markedRenderer.hr = () => {
            return this.colorize('─'.repeat(this.options.maxWidth), '90') + '\n\n';
        };

        // Tables
        this.markedRenderer.table = (header, body) => {
            return this.renderTable(header, body) + '\n';
        };

        // Paragraphs
        this.markedRenderer.paragraph = (text) => {
            const wrapped = this.wrapText(text, this.options.maxWidth);
            return wrapped.join('\n') + '\n\n';
        };

        // Images (show alt text and URL)
        this.markedRenderer.image = (href, title, text) => {
            return `\x1b[35m[Image: ${text || title || 'untitled'}]\x1b[0m \x1b[34m(${href})\x1b[0m`;
        };

        // HTML (sanitize and show warning)
        this.markedRenderer.html = (html) => {
            if (typeof DOMPurify !== 'undefined') {
                const clean = DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: false });
                return `\x1b[90m[HTML: ${this.stripHtml(clean).substring(0, 50)}...]\x1b[0m\n`;
            }
            return `\x1b[90m[HTML content]\x1b[0m\n`;
        };
    }

    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('EnhancedMarkdownRenderer can only handle text content');
        }

        if (typeof marked === 'undefined') {
            // Fallback to basic rendering
            const { MarkdownRenderer } = await import('./MarkdownRenderer.js');
            const fallback = new MarkdownRenderer(this.options);
            return fallback.render(content, filename, metadata);
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename);
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateMetadataDisplay(metadata, filename, 'Markdown Document');
        }

        // Parse with marked
        try {
            const parsed = marked.parse(content, { renderer: this.markedRenderer });
            output += this.cleanupOutput(parsed);
        } catch (error) {
            console.error('Marked parsing error:', error);
            // Fallback to basic rendering
            const { MarkdownRenderer } = await import('./MarkdownRenderer.js');
            const fallback = new MarkdownRenderer(this.options);
            return fallback.render(content, filename, metadata);
        }

        return output;
    }

    renderCodeBlock(code, language = '') {
        const lines = code.split('\n');
        let output = '';
        
        // Try to use highlight.js if available
        let highlightedCode = code;
        if (typeof hljs !== 'undefined' && language) {
            try {
                const result = hljs.highlight(code, { language: language.toLowerCase() });
                highlightedCode = this.convertHljsToAnsi(result.value);
                lines.splice(0, lines.length, ...highlightedCode.split('\n'));
            } catch (e) {
                // Fallback to unhighlighted code
            }
        }
        
        // Header with language
        if (language) {
            output += this.colorize(`┌─ ${language} `, '90') + 
                     this.colorize('─'.repeat(Math.max(0, this.options.maxWidth - language.length - 4)), '90') + '\n';
        } else {
            output += this.colorize('┌' + '─'.repeat(this.options.maxWidth - 1), '90') + '\n';
        }
        
        // Code lines
        for (const line of lines) {
            output += this.colorize('│ ', '90') + line + '\n';
        }
        
        // Footer
        output += this.colorize('└' + '─'.repeat(this.options.maxWidth - 1), '90');
        
        return output;
    }

    convertHljsToAnsi(html) {
        // Convert highlight.js HTML classes to ANSI codes
        let ansi = html;
        
        // Remove HTML tags but preserve the highlighting intent
        ansi = ansi.replace(/<span class="hljs-keyword">(.*?)<\/span>/g, '\x1b[35m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-string">(.*?)<\/span>/g, '\x1b[32m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-number">(.*?)<\/span>/g, '\x1b[33m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-comment">(.*?)<\/span>/g, '\x1b[90m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-function">(.*?)<\/span>/g, '\x1b[36m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-class">(.*?)<\/span>/g, '\x1b[94m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-variable">(.*?)<\/span>/g, '\x1b[96m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-operator">(.*?)<\/span>/g, '\x1b[91m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-built_in">(.*?)<\/span>/g, '\x1b[94m$1\x1b[0m');
        ansi = ansi.replace(/<span class="hljs-.*?">(.*?)<\/span>/g, '$1');
        ansi = ansi.replace(/<.*?>/g, '');
        
        // Decode HTML entities
        ansi = ansi.replace(/&lt;/g, '<');
        ansi = ansi.replace(/&gt;/g, '>');
        ansi = ansi.replace(/&amp;/g, '&');
        ansi = ansi.replace(/&quot;/g, '"');
        ansi = ansi.replace(/&#39;/g, "'");
        
        return ansi;
    }

    renderTable(header, body) {
        // Parse header and body HTML to extract table data
        const headerRows = this.parseTableHtml(header);
        const bodyRows = this.parseTableHtml(body);
        const allRows = [...headerRows, ...bodyRows];
        
        if (allRows.length === 0) return '';
        
        // Calculate column widths
        const colWidths = [];
        for (const row of allRows) {
            for (let i = 0; i < row.length; i++) {
                const cellWidth = this.stripAnsi(row[i]).length;
                colWidths[i] = Math.max(colWidths[i] || 0, cellWidth);
            }
        }
        
        let output = '';
        
        // Top border
        output += '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐\n';
        
        // Header rows
        for (let i = 0; i < headerRows.length; i++) {
            output += this.renderTableRow(headerRows[i], colWidths, true);
            if (i === headerRows.length - 1 && bodyRows.length > 0) {
                // Separator between header and body
                output += '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤\n';
            }
        }
        
        // Body rows
        for (const row of bodyRows) {
            output += this.renderTableRow(row, colWidths, false);
        }
        
        // Bottom border
        output += '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';
        
        return output;
    }

    parseTableHtml(html) {
        if (!html) return [];
        
        const rows = [];
        const rowMatches = html.match(/<tr[^>]*>(.*?)<\/tr>/gs) || [];
        
        for (const rowHtml of rowMatches) {
            const cells = [];
            const cellMatches = rowHtml.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gs) || [];
            
            for (const cellHtml of cellMatches) {
                const cellContent = cellHtml.replace(/<t[hd][^>]*>|<\/t[hd]>/g, '');
                cells.push(this.stripHtml(cellContent).trim());
            }
            
            if (cells.length > 0) {
                rows.push(cells);
            }
        }
        
        return rows;
    }

    renderTableRow(cells, colWidths, isHeader) {
        let row = '│';
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i] || '';
            const padding = colWidths[i] - this.stripAnsi(cell).length;
            
            if (isHeader) {
                row += ' ' + this.colorize(cell, '1') + ' '.repeat(padding) + ' │';
            } else {
                row += ' ' + cell + ' '.repeat(padding) + ' │';
            }
        }
        return row + '\n';
    }

    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '');
    }

    stripAnsi(text) {
        return text.replace(/\x1b\[[0-9;]*m/g, '');
    }

    cleanupOutput(output) {
        // Remove excessive newlines
        output = output.replace(/\n{3,}/g, '\n\n');
        // Remove trailing whitespace
        output = output.replace(/[ \t]+$/gm, '');
        // Ensure single newline at end
        output = output.trimEnd() + '\n';
        return output;
    }

    renderLargeFileWarning(size, filename) {
        return this.colorize('⚠ File too large for rendering', '33') + '\n' +
               `File: ${filename}\n` +
               `Size: ${this.formatFileSize(size)}\n` +
               `Limit: ${this.formatFileSize(1024 * 1024)}\n\n` +
               this.colorize('Use a different tool for large markdown files.', '90');
    }
}