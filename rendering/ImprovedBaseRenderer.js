import { TerminalStyler } from './TerminalStyler.js';

/**
 * Improved base renderer using proper terminal styling libraries
 * Replaces manual ANSI code handling with TerminalStyler
 */
export class ImprovedBaseRenderer {
    constructor(options = {}) {
        this.options = {
            maxWidth: 80,
            colorOutput: true,
            interactive: false,
            showMetadata: false,
            maxFileSize: 1024 * 1024, // 1MB
            ...options
        };
        
        this.styler = new TerminalStyler();
    }
    
    /**
     * Check if this renderer can handle the file type
     * @param {string} fileType 
     * @returns {boolean}
     */
    canRender(fileType) {
        return false; // Override in subclasses
    }
    
    /**
     * Get renderer priority (higher = preferred)
     * @returns {number}
     */
    getPriority() {
        return 1;
    }
    
    /**
     * Get renderer name
     * @returns {string}
     */
    getName() {
        return this.constructor.name;
    }
    
    /**
     * Main render method - override in subclasses
     * @param {string|ArrayBuffer} content 
     * @param {string} filename 
     * @param {Object} metadata 
     * @returns {Promise<string>}
     */
    async render(content, filename, metadata = {}) {
        throw new Error('render() method must be implemented by subclasses');
    }
    
    /**
     * Check if content is too large for rendering
     * @param {string|ArrayBuffer} content 
     * @returns {boolean}
     */
    isContentTooLarge(content) {
        const size = content instanceof ArrayBuffer ? content.byteLength : content.length;
        return size > this.options.maxFileSize;
    }
    
    /**
     * Generate metadata display
     * @param {Object} metadata 
     * @param {string} filename 
     * @param {string} type 
     * @returns {string}
     */
    generateMetadataDisplay(metadata, filename, type) {
        const lines = [];
        lines.push(this.styler.separator(this.options.maxWidth));
        lines.push(this.styler.info('File Information:'));
        lines.push(`  Name: ${filename}`);
        lines.push(`  Type: ${type}`);
        
        if (metadata.size) {
            lines.push(`  Size: ${this.formatFileSize(metadata.size)}`);
        }
        
        if (metadata.modified) {
            lines.push(`  Modified: ${new Date(metadata.modified).toLocaleString()}`);
        }
        
        lines.push(this.styler.separator(this.options.maxWidth));
        lines.push(''); // Empty line after metadata
        
        return lines.join('\n');
    }
    
    /**
     * Format file size for display
     * @param {number} bytes 
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
    }
    
    /**
     * Render warning for large files
     * @param {number} size 
     * @param {string} filename 
     * @param {string} suggestion 
     * @returns {string}
     */
    renderLargeFileWarning(size, filename, suggestion = 'Use a specialized tool for large files.') {
        const lines = [];
        lines.push(this.styler.warning('⚠ File too large for rendering'));
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Size: ${this.formatFileSize(size)}`);
        lines.push(`Limit: ${this.formatFileSize(this.options.maxFileSize)}`);
        lines.push('');
        lines.push(this.styler.muted(suggestion));
        
        return lines.join('\n');
    }
    
    /**
     * Render error message
     * @param {Error} error 
     * @param {string} filename 
     * @returns {string}
     */
    renderError(error, filename) {
        const lines = [];
        lines.push(this.styler.error(`⚠ Error rendering ${filename}`));
        lines.push('');
        lines.push(this.styler.muted(`Error: ${error.message}`));
        lines.push('');
        lines.push(this.styler.muted('Falling back to plain text display...'));
        
        return lines.join('\n');
    }
    
    /**
     * Create a simple table
     * @param {string[][]} rows 
     * @param {Object} options 
     * @returns {string}
     */
    createTable(rows, options = {}) {
        if (typeof Table !== 'undefined') {
            // Use cli-table3 if available
            const table = new Table({
                style: { 
                    head: options.headerColor ? [options.headerColor] : ['cyan'],
                    border: ['grey']
                },
                colWidths: options.colWidths,
                wordWrap: true,
                wrapOnWordBoundary: false
            });
            
            if (options.headers && rows.length > 0) {
                table.push({ [rows[0].join('|')]: [] });
                rows.slice(1).forEach(row => table.push(row));
            } else {
                rows.forEach(row => table.push(row));
            }
            
            return table.toString();
        } else {
            // Fallback to manual table creation
            return this.createManualTable(rows, options);
        }
    }
    
    /**
     * Create table manually without cli-table3
     * @param {string[][]} rows 
     * @param {Object} options 
     * @returns {string}
     */
    createManualTable(rows, options = {}) {
        if (rows.length === 0) return '';
        
        // Calculate column widths
        const colWidths = [];
        rows.forEach(row => {
            row.forEach((cell, i) => {
                const cellWidth = this.styler.getWidth(String(cell));
                colWidths[i] = Math.max(colWidths[i] || 0, cellWidth);
            });
        });
        
        const lines = [];
        const totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + (colWidths.length - 1) * 3 + 2; // borders and padding
        
        // Top border
        lines.push(this.styler.muted('┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐'));
        
        // Rows
        rows.forEach((row, rowIndex) => {
            let line = this.styler.muted('│');
            row.forEach((cell, colIndex) => {
                const cellStr = String(cell);
                const paddedCell = this.styler.padRight(cellStr, colWidths[colIndex]);
                
                if (rowIndex === 0 && options.headers) {
                    line += ' ' + this.styler.style(paddedCell, 'bold') + ' ' + this.styler.muted('│');
                } else {
                    line += ' ' + paddedCell + ' ' + this.styler.muted('│');
                }
            });
            lines.push(line);
            
            // Header separator
            if (rowIndex === 0 && options.headers && rows.length > 1) {
                lines.push(this.styler.muted('├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤'));
            }
        });
        
        // Bottom border
        lines.push(this.styler.muted('└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘'));
        
        return lines.join('\n');
    }
    
    /**
     * Create a code block with syntax highlighting
     * @param {string} code 
     * @param {string} language 
     * @returns {string}
     */
    createCodeBlock(code, language = '') {
        const lines = code.split('\n');
        const result = [];
        
        // Header
        if (language) {
            const headerText = `─ ${language} `;
            const padding = '─'.repeat(Math.max(0, this.options.maxWidth - headerText.length - 1));
            result.push(this.styler.muted('┌' + headerText + padding));
        } else {
            result.push(this.styler.muted('┌' + '─'.repeat(this.options.maxWidth - 1)));
        }
        
        // Code lines with basic syntax highlighting
        lines.forEach(line => {
            const highlightedLine = this.applyBasicSyntaxHighlighting(line, language);
            result.push(this.styler.muted('│ ') + highlightedLine);
        });
        
        // Footer
        result.push(this.styler.muted('└' + '─'.repeat(this.options.maxWidth - 1)));
        
        return result.join('\n');
    }
    
    /**
     * Apply basic syntax highlighting to a line of code
     * @param {string} line 
     * @param {string} language 
     * @returns {string}
     */
    applyBasicSyntaxHighlighting(line, language) {
        if (!this.options.colorOutput) return line;
        
        let highlighted = line;
        
        // Generic patterns that work across languages
        // Comments
        highlighted = highlighted.replace(/(\/\/.*$|#.*$|<!--.*?-->)/g, 
            match => this.styler.comment(match));
        
        // Strings
        highlighted = highlighted.replace(/(['"`])((?:(?!\1)[^\\]|\\.)*)(\1)/g,
            match => this.styler.string(match));
        
        // Numbers
        highlighted = highlighted.replace(/\b\d+\.?\d*\b/g,
            match => this.styler.number(match));
        
        // Language-specific keywords
        const keywords = this.getKeywordsForLanguage(language);
        if (keywords.length > 0) {
            const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
            highlighted = highlighted.replace(keywordRegex,
                match => this.styler.keyword(match));
        }
        
        return highlighted;
    }
    
    /**
     * Get keywords for syntax highlighting
     * @param {string} language 
     * @returns {string[]}
     */
    getKeywordsForLanguage(language) {
        const keywordSets = {
            javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await'],
            typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await', 'interface', 'type'],
            python: ['def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'return', 'try', 'except', 'with', 'as'],
            java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'if', 'else', 'for', 'while', 'return', 'new'],
            css: ['color', 'background', 'margin', 'padding', 'display', 'position', 'font', 'border', 'width', 'height']
        };
        
        return keywordSets[language.toLowerCase()] || [];
    }
    
    /**
     * Truncate text with ellipsis
     * @param {string} text 
     * @param {number} maxLength 
     * @returns {string}
     */
    truncate(text, maxLength) {
        if (this.styler.getWidth(text) <= maxLength) return text;
        
        // Account for ellipsis
        const truncated = text.substring(0, maxLength - 3);
        return truncated + '...';
    }
}