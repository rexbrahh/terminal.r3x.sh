/**
 * Base class for all file renderers
 * Defines the interface that all renderers must implement
 */
export class BaseRenderer {
    constructor(options = {}) {
        this.options = {
            maxWidth: 80,
            colorOutput: true,
            interactive: false,
            ...options
        };
    }

    /**
     * Render content for terminal display
     * @param {string|ArrayBuffer} content - The file content
     * @param {string} filename - The original filename
     * @param {Object} metadata - Additional file metadata
     * @returns {Promise<string>} - Rendered content ready for terminal display
     */
    async render(content, filename, metadata = {}) {
        throw new Error('render() method must be implemented by subclass');
    }

    /**
     * Check if this renderer can handle the given file type
     * @param {string} fileType - The detected file type
     * @returns {boolean}
     */
    canRender(fileType) {
        return false;
    }

    /**
     * Get renderer priority (higher = more preferred)
     * Used when multiple renderers can handle the same file type
     * @returns {number}
     */
    getPriority() {
        return 0;
    }

    /**
     * Get renderer name for debugging/logging
     * @returns {string}
     */
    getName() {
        return this.constructor.name;
    }

    /**
     * Wrap text to specified width, handling ANSI escape codes
     * @param {string} text 
     * @param {number} width 
     * @returns {string[]}
     */
    wrapText(text, width = this.options.maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        let currentLength = 0;
        
        for (const word of words) {
            // Calculate actual display length (ignoring ANSI codes)
            const wordDisplayLength = word.replace(/\x1b\[[0-9;]*m/g, '').length;
            
            // If adding this word would exceed width, start new line
            if (currentLength + wordDisplayLength + 1 > width && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
                currentLength = wordDisplayLength;
            } else {
                // Add word to current line
                if (currentLine === '') {
                    currentLine = word;
                    currentLength = wordDisplayLength;
                } else {
                    currentLine += ' ' + word;
                    currentLength += wordDisplayLength + 1;
                }
            }
        }
        
        // Add the last line
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        
        return lines;
    }

    /**
     * Apply ANSI color codes if color output is enabled
     * @param {string} text 
     * @param {string} colorCode - ANSI color code (e.g., '32' for green)
     * @returns {string}
     */
    colorize(text, colorCode) {
        if (!this.options.colorOutput) return text;
        return `\x1b[${colorCode}m${text}\x1b[0m`;
    }

    /**
     * Add line numbers to content
     * @param {string} content 
     * @param {number} startLine 
     * @returns {string}
     */
    addLineNumbers(content, startLine = 1) {
        const lines = content.split('\n');
        const maxDigits = (startLine + lines.length - 1).toString().length;
        
        return lines.map((line, index) => {
            const lineNum = (startLine + index).toString().padStart(maxDigits, ' ');
            return this.colorize(`${lineNum} │ `, '90') + line;
        }).join('\n');
    }

    /**
     * Create a horizontal separator line
     * @param {string} char 
     * @param {number} width 
     * @returns {string}
     */
    createSeparator(char = '─', width = this.options.maxWidth) {
        return char.repeat(width);
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
     * Truncate text to specified length with ellipsis
     * @param {string} text 
     * @param {number} maxLength 
     * @returns {string}
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Escape HTML/special characters for safe display
     * @param {string} text 
     * @returns {string}
     */
    escapeText(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Check if content appears to be too large for rendering
     * @param {string|ArrayBuffer} content 
     * @returns {boolean}
     */
    isContentTooLarge(content) {
        const maxSize = 1024 * 1024; // 1MB
        if (content instanceof ArrayBuffer) {
            return content.byteLength > maxSize;
        }
        return content.length > maxSize;
    }

    /**
     * Generate metadata display for file
     * @param {Object} metadata 
     * @param {string} filename 
     * @param {string} fileType 
     * @returns {string}
     */
    generateMetadataDisplay(metadata, filename, fileType) {
        const lines = [];
        
        if (filename) {
            lines.push(this.colorize('File:', '36') + ' ' + filename);
        }
        
        if (fileType) {
            lines.push(this.colorize('Type:', '36') + ' ' + fileType);
        }
        
        if (metadata.size) {
            lines.push(this.colorize('Size:', '36') + ' ' + this.formatFileSize(metadata.size));
        }
        
        if (metadata.modified) {
            lines.push(this.colorize('Modified:', '36') + ' ' + new Date(metadata.modified).toLocaleString());
        }
        
        if (lines.length > 0) {
            return lines.join('\n') + '\n' + this.createSeparator() + '\n';
        }
        
        return '';
    }
}