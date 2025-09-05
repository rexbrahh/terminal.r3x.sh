import { BaseRenderer } from '../BaseRenderer.js';

/**
 * Simple text file renderer with basic formatting
 */
export class TextRenderer extends BaseRenderer {
    constructor(options = {}) {
        super(options);
    }

    /**
     * Check if this renderer can handle the file type
     * @param {string} fileType 
     * @returns {boolean}
     */
    canRender(fileType) {
        const textTypes = ['text', 'log', 'ini', 'config', 'unknown'];
        return textTypes.includes(fileType);
    }

    /**
     * Get renderer priority (lower priority - fallback renderer)
     * @returns {number}
     */
    getPriority() {
        return 1;
    }

    /**
     * Render text content
     * @param {string} content 
     * @param {string} filename 
     * @param {Object} metadata 
     * @returns {Promise<string>}
     */
    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('TextRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename);
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateMetadataDisplay(metadata, filename, 'Text File');
        }

        // Format and wrap text content
        output += this.formatTextContent(content);

        return output;
    }

    /**
     * Format text content with wrapping and basic enhancements
     * @param {string} content 
     * @returns {string}
     */
    formatTextContent(content) {
        const lines = content.split('\n');
        const formattedLines = [];

        for (const line of lines) {
            // Handle empty lines
            if (line.trim() === '') {
                formattedLines.push('');
                continue;
            }

            // Apply basic text enhancements
            let processedLine = this.enhanceTextLine(line);

            // Wrap long lines if they exceed max width
            if (this.getDisplayLength(processedLine) > this.options.maxWidth) {
                const wrapped = this.wrapText(processedLine, this.options.maxWidth);
                formattedLines.push(...wrapped);
            } else {
                formattedLines.push(processedLine);
            }
        }

        return formattedLines.join('\n');
    }

    /**
     * Apply basic enhancements to text lines
     * @param {string} line 
     * @returns {string}
     */
    enhanceTextLine(line) {
        if (!this.options.colorOutput) return line;

        let enhanced = line;

        // Highlight URLs
        enhanced = enhanced.replace(/(https?:\/\/[^\s]+)/g, (match) => {
            return this.colorize(match, '34'); // Blue
        });

        // Highlight file paths
        enhanced = enhanced.replace(/(\/?[\w-]+(?:\/[\w.-]+)+)/g, (match) => {
            return this.colorize(match, '36'); // Cyan
        });

        // Highlight numbers
        enhanced = enhanced.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => {
            return this.colorize(match, '33'); // Yellow
        });

        // Highlight quoted strings
        enhanced = enhanced.replace(/(['"])(.*?)\1/g, (match) => {
            return this.colorize(match, '32'); // Green
        });

        // Highlight parenthesized content
        enhanced = enhanced.replace(/(\([^)]+\))/g, (match) => {
            return this.colorize(match, '90'); // Gray
        });

        return enhanced;
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
        const maxSize = 1024 * 1024; // 1MB
        const previewSize = 2000; // Show first 2000 chars
        
        let output = this.colorize('⚠ Large file detected', '33') + '\n';
        output += `File: ${filename}\n`;
        output += `Size: ${this.formatFileSize(size)}\n`;
        output += `Showing first ${previewSize} characters...\n\n`;
        output += this.createSeparator() + '\n';
        
        // Show preview of file content
        const preview = content.substring(0, previewSize);
        output += this.formatTextContent(preview);
        
        output += '\n' + this.createSeparator() + '\n';
        output += this.colorize(`[${size - previewSize} more characters not shown]`, '90');
        
        return output;
    }
}