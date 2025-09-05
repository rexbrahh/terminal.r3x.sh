import { BaseRenderer } from '../BaseRenderer.js';

/**
 * Markdown renderer with enhanced formatting and proper line wrapping
 */
export class MarkdownRenderer extends BaseRenderer {
    constructor(options = {}) {
        super(options);
    }

    /**
     * Check if this renderer can handle the file type
     * @param {string} fileType 
     * @returns {boolean}
     */
    canRender(fileType) {
        return fileType === 'markdown';
    }

    /**
     * Get renderer priority
     * @returns {number}
     */
    getPriority() {
        return 10; // High priority for markdown files
    }

    /**
     * Render markdown content
     * @param {string} content 
     * @param {string} filename 
     * @param {Object} metadata 
     * @returns {Promise<string>}
     */
    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('MarkdownRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename);
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateMetadataDisplay(metadata, filename, 'Markdown Document');
        }

        // Process markdown content
        const rendered = this.processMarkdown(content);
        output += this.formatForTerminal(rendered);

        return output;
    }

    /**
     * Process markdown syntax and convert to terminal-friendly format
     * @param {string} content 
     * @returns {string}
     */
    processMarkdown(content) {
        let rendered = content;
        
        // Headers (must be processed first to avoid conflicts)
        rendered = rendered.replace(/^### (.*)/gm, (match, text) => {
            return this.colorize('### ' + text, '33'); // Yellow
        });
        rendered = rendered.replace(/^## (.*)/gm, (match, text) => {
            return this.colorize('## ' + text, '32'); // Green
        });
        rendered = rendered.replace(/^# (.*)/gm, (match, text) => {
            return this.colorize('# ' + text, '36'); // Cyan
        });
        
        // Code blocks (must be before inline code)
        rendered = rendered.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, language, code) => {
            return this.renderCodeBlock(code.trim(), language);
        });
        
        // Inline code
        rendered = rendered.replace(/`([^`\n]+)`/g, (match, code) => {
            return this.colorize(code, '93'); // Bright yellow
        });
        
        // Bold text
        rendered = rendered.replace(/\*\*(.*?)\*\*/g, (match, text) => {
            return this.colorize(text, '1'); // Bold
        });
        
        // Italic text (shown as dim)
        rendered = rendered.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, (match, text) => {
            return this.colorize(text, '2'); // Dim
        });
        
        // Strikethrough
        rendered = rendered.replace(/~~(.*?)~~/g, (match, text) => {
            return this.colorize(text, '9'); // Strikethrough
        });
        
        // Links
        rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            return `${text} ${this.colorize('(' + url + ')', '34')}`; // Blue URL
        });
        
        // Auto-links
        rendered = rendered.replace(/(https?:\/\/[^\s]+)/g, (match, url) => {
            return this.colorize(url, '34'); // Blue
        });
        
        // Unordered lists
        rendered = rendered.replace(/^[\s]*[-*+]\s+(.*)/gm, (match, text) => {
            return '  • ' + text;
        });
        
        // Ordered lists
        rendered = rendered.replace(/^[\s]*(\d+)\.\s+(.*)/gm, (match, num, text) => {
            return `  ${num}. ${text}`;
        });
        
        // Blockquotes
        rendered = rendered.replace(/^>\s*(.*)/gm, (match, text) => {
            return this.colorize('│ ', '90') + this.colorize(text, '37');
        });
        
        // Horizontal rules
        rendered = rendered.replace(/^[-*_]{3,}$/gm, () => {
            return this.createSeparator('─', this.options.maxWidth);
        });
        
        // Tables (basic support)
        rendered = this.processTables(rendered);
        
        return rendered;
    }

    /**
     * Render code blocks with syntax highlighting hints
     * @param {string} code 
     * @param {string} language 
     * @returns {string}
     */
    renderCodeBlock(code, language = '') {
        const lines = code.split('\n');
        let output = '';
        
        // Header with language
        if (language) {
            output += this.colorize(`┌─ ${language} `, '90') + 
                     this.colorize('─'.repeat(Math.max(0, this.options.maxWidth - language.length - 4)), '90') + '\n';
        } else {
            output += this.colorize('┌' + '─'.repeat(this.options.maxWidth - 1), '90') + '\n';
        }
        
        // Code lines with basic syntax highlighting
        for (const line of lines) {
            const highlightedLine = this.applyBasicSyntaxHighlighting(line, language);
            output += this.colorize('│ ', '90') + highlightedLine + '\n';
        }
        
        // Footer
        output += this.colorize('└' + '─'.repeat(this.options.maxWidth - 1), '90');
        
        return output;
    }

    /**
     * Apply basic syntax highlighting for common languages
     * @param {string} line 
     * @param {string} language 
     * @returns {string}
     */
    applyBasicSyntaxHighlighting(line, language) {
        if (!this.options.colorOutput) return line;

        let highlighted = line;
        
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'js':
            case 'typescript':
            case 'ts':
                // Keywords
                highlighted = highlighted.replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|async|await)\b/g, 
                    (match) => this.colorize(match, '35')); // Magenta
                // Strings
                highlighted = highlighted.replace(/(['"`])(.*?)\1/g, 
                    (match) => this.colorize(match, '32')); // Green
                // Comments
                highlighted = highlighted.replace(/(\/\/.*$)/g, 
                    (match) => this.colorize(match, '90')); // Gray
                break;
                
            case 'python':
                // Keywords
                highlighted = highlighted.replace(/\b(def|class|import|from|if|else|elif|for|while|return|try|except|with|as)\b/g, 
                    (match) => this.colorize(match, '35')); // Magenta
                // Strings
                highlighted = highlighted.replace(/(['"`])(.*?)\1/g, 
                    (match) => this.colorize(match, '32')); // Green
                // Comments
                highlighted = highlighted.replace(/(#.*$)/g, 
                    (match) => this.colorize(match, '90')); // Gray
                break;
                
            case 'json':
                // Keys
                highlighted = highlighted.replace(/("[\w-]+")(\s*:)/g, 
                    (match, key, colon) => this.colorize(key, '36') + colon); // Cyan
                // Strings
                highlighted = highlighted.replace(/(:\s*")([^"]*?)(")/g, 
                    (match, pre, str, post) => pre + this.colorize(`"${str}"`, '32') + ''); // Green
                // Numbers
                highlighted = highlighted.replace(/(:\s*)(\d+\.?\d*)/g, 
                    (match, pre, num) => pre + this.colorize(num, '33')); // Yellow
                break;
                
            default:
                // Generic highlighting for unknown languages
                // Strings
                highlighted = highlighted.replace(/(['"`])(.*?)\1/g, 
                    (match) => this.colorize(match, '32')); // Green
                // Comments (common patterns)
                highlighted = highlighted.replace(/(\/\/.*$|#.*$|<!--.*?-->)/g, 
                    (match) => this.colorize(match, '90')); // Gray
        }
        
        return highlighted;
    }

    /**
     * Process markdown tables
     * @param {string} content 
     * @returns {string}
     */
    processTables(content) {
        const lines = content.split('\n');
        const result = [];
        let inTable = false;
        let tableLines = [];
        
        for (const line of lines) {
            const isTableRow = line.trim().includes('|') && line.trim().length > 2;
            
            if (isTableRow && !inTable) {
                inTable = true;
                tableLines = [line];
            } else if (isTableRow && inTable) {
                tableLines.push(line);
            } else if (!isTableRow && inTable) {
                // End of table
                result.push(this.renderTable(tableLines));
                result.push(line);
                inTable = false;
                tableLines = [];
            } else {
                result.push(line);
            }
        }
        
        // Handle table at end of content
        if (inTable && tableLines.length > 0) {
            result.push(this.renderTable(tableLines));
        }
        
        return result.join('\n');
    }

    /**
     * Render a markdown table
     * @param {string[]} tableLines 
     * @returns {string}
     */
    renderTable(tableLines) {
        if (tableLines.length < 2) return tableLines.join('\n');
        
        // Parse table structure
        const rows = tableLines.map(line => {
            return line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
        });
        
        // Calculate column widths
        const colWidths = [];
        for (const row of rows) {
            for (let i = 0; i < row.length; i++) {
                const cellWidth = row[i].replace(/\x1b\[[0-9;]*m/g, '').length; // Remove ANSI codes
                colWidths[i] = Math.max(colWidths[i] || 0, cellWidth);
            }
        }
        
        let output = '';
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            
            // Skip separator row (usually row 1)
            if (rowIndex === 1 && row.every(cell => /^-+$/.test(cell.trim()))) {
                // Add table header separator
                output += '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤\n';
                continue;
            }
            
            // Render table row
            let line = '│';
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const cell = row[colIndex] || '';
                const padding = colWidths[colIndex] - cell.replace(/\x1b\[[0-9;]*m/g, '').length;
                
                if (rowIndex === 0) {
                    // Header row - make it bold
                    line += ' ' + this.colorize(cell, '1') + ' '.repeat(padding) + ' │';
                } else {
                    line += ' ' + cell + ' '.repeat(padding) + ' │';
                }
            }
            output += line + '\n';
            
            // Add top border for first row
            if (rowIndex === 0) {
                const topBorder = '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
                output = topBorder + '\n' + output;
            }
        }
        
        // Add bottom border
        output += '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';
        
        return output;
    }

    /**
     * Format content for terminal display with proper wrapping
     * @param {string} text 
     * @returns {string}
     */
    formatForTerminal(text) {
        const lines = text.split('\n');
        const formattedLines = [];
        
        for (let line of lines) {
            // Skip empty lines (preserve spacing)
            if (line.trim() === '') {
                formattedLines.push('');
                continue;
            }
            
            // Don't wrap headers, lists, code blocks, tables, or separators
            if (line.match(/^(\x1b\[\d+m)?(#{1,3}|•|-|\d+\.|┌|├|└|│|─)/)) {
                formattedLines.push(line);
                continue;
            }
            
            // Wrap long paragraphs
            if (this.getDisplayLength(line) > this.options.maxWidth) {
                const wrapped = this.wrapText(line, this.options.maxWidth);
                formattedLines.push(...wrapped);
            } else {
                formattedLines.push(line);
            }
        }
        
        // Add proper spacing between sections
        const result = [];
        for (let i = 0; i < formattedLines.length; i++) {
            const current = formattedLines[i];
            const next = formattedLines[i + 1];
            
            result.push(current);
            
            // Add extra line after headers
            if (current.match(/^(\x1b\[\d+m)?#{1,3}/) && next && next.trim() !== '') {
                result.push('');
            }
        }
        
        return result.join('\n');
    }

    /**
     * Get display length of text (excluding ANSI codes)
     * @param {string} text 
     * @returns {number}
     */
    getDisplayLength(text) {
        return text.replace(/\x1b\[[0-9;]*m/g, '').length;
    }

    /**
     * Render warning for large files
     * @param {number} size 
     * @param {string} filename 
     * @returns {string}
     */
    renderLargeFileWarning(size, filename) {
        return this.colorize('⚠ File too large for rendering', '33') + '\n' +
               `File: ${filename}\n` +
               `Size: ${this.formatFileSize(size)}\n` +
               `Limit: ${this.formatFileSize(1024 * 1024)}\n\n` +
               this.colorize('Use a different tool for large markdown files.', '90');
    }
}