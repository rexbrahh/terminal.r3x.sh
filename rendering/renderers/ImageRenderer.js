import { BaseRenderer } from '../BaseRenderer.js';

/**
 * Image renderer that converts images to ASCII art or displays inline
 */
export class ImageRenderer extends BaseRenderer {
    constructor(options = {}) {
        super({
            asciiWidth: 80,
            asciiHeight: 40,
            asciiChars: ' .,:;irsXA253hMHGS#9B&@',
            contrastBoost: 1.2,
            brightnessAdjust: 0.1,
            ...options
        });
    }

    /**
     * Check if this renderer can handle the file type
     * @param {string} fileType 
     * @returns {boolean}
     */
    canRender(fileType) {
        return fileType === 'image';
    }

    /**
     * Get renderer priority
     * @returns {number}
     */
    getPriority() {
        return 8; // High priority for images
    }

    /**
     * Render image content
     * @param {string|ArrayBuffer} content 
     * @param {string} filename 
     * @param {Object} metadata 
     * @returns {Promise<string>}
     */
    async render(content, filename, metadata = {}) {
        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content, filename);
        }

        let output = '';

        // Add metadata
        if (this.options.showMetadata) {
            output += this.generateImageMetadata(metadata, filename);
        }

        try {
            // Try to render as ASCII art
            const asciiArt = await this.convertToAscii(content, filename);
            output += asciiArt;

            // Add option to view original (if supported)
            output += '\n\n' + this.colorize('[Image rendered as ASCII art]', '90');
            output += '\n' + this.colorize('Original format: ' + this.getImageFormat(filename), '90');
            
        } catch (error) {
            // Fallback to basic info display
            output += this.renderImageFallback(content, filename, error);
        }

        return output;
    }

    /**
     * Convert image to ASCII art
     * @param {string|ArrayBuffer} content 
     * @param {string} filename 
     * @returns {Promise<string>}
     */
    async convertToAscii(content, filename) {
        // For now, create a placeholder ASCII art
        // In a real implementation, you'd use Canvas API or image processing library
        
        const format = this.getImageFormat(filename);
        const placeholder = this.generatePlaceholderAscii(filename, format);
        
        return placeholder;
    }

    /**
     * Generate placeholder ASCII art for images
     * @param {string} filename 
     * @param {string} format 
     * @returns {string}
     */
    generatePlaceholderAscii(filename, format) {
        const width = Math.min(this.options.asciiWidth, 60);
        const height = Math.min(this.options.asciiHeight, 20);
        
        let ascii = '';
        
        // Top border
        ascii += '┌' + '─'.repeat(width - 2) + '┐\n';
        
        // Content area with image icon
        const centerY = Math.floor(height / 2);
        const centerX = Math.floor(width / 2);
        
        for (let y = 1; y < height - 1; y++) {
            ascii += '│';
            
            if (y === centerY - 2) {
                const text = '🖼️  IMAGE FILE';
                const padding = Math.max(0, width - text.length - 2);
                const leftPad = Math.floor(padding / 2);
                ascii += ' '.repeat(leftPad) + text + ' '.repeat(padding - leftPad);
            } else if (y === centerY) {
                const text = format.toUpperCase();
                const padding = Math.max(0, width - text.length - 2);
                const leftPad = Math.floor(padding / 2);
                ascii += ' '.repeat(leftPad) + this.colorize(text, '36') + ' '.repeat(padding - leftPad);
            } else if (y === centerY + 2) {
                const text = this.truncate(filename, width - 4);
                const padding = Math.max(0, width - text.length - 2);
                const leftPad = Math.floor(padding / 2);
                ascii += ' '.repeat(leftPad) + this.colorize(text, '33') + ' '.repeat(padding - leftPad);
            } else {
                ascii += ' '.repeat(width - 2);
            }
            
            ascii += '│\n';
        }
        
        // Bottom border
        ascii += '└' + '─'.repeat(width - 2) + '┘';
        
        return ascii;
    }

    /**
     * Generate a simple pattern-based ASCII representation
     * @param {number} width 
     * @param {number} height 
     * @returns {string}
     */
    generatePatternAscii(width, height) {
        let ascii = '';
        const chars = this.options.asciiChars;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Create a simple pattern
                const distance = Math.sqrt((x - width/2)**2 + (y - height/2)**2);
                const normalized = Math.min(1, distance / (Math.min(width, height) / 2));
                const charIndex = Math.floor(normalized * (chars.length - 1));
                ascii += chars[charIndex];
            }
            ascii += '\n';
        }
        
        return ascii.trim();
    }

    /**
     * Render image fallback when ASCII conversion fails
     * @param {string|ArrayBuffer} content 
     * @param {string} filename 
     * @param {Error} error 
     * @returns {string}
     */
    renderImageFallback(content, filename, error) {
        const format = this.getImageFormat(filename);
        let size = 'Unknown';
        
        if (content instanceof ArrayBuffer) {
            size = this.formatFileSize(content.byteLength);
        } else if (typeof content === 'string') {
            size = this.formatFileSize(content.length);
        }
        
        let output = '';
        
        // Error message
        output += this.colorize('⚠ Unable to render image as ASCII', '33') + '\n';
        output += this.colorize('Error: ' + error.message, '90') + '\n\n';
        
        // Basic info box
        output += '┌' + '─'.repeat(50) + '┐\n';
        output += '│' + ' '.repeat(50) + '│\n';
        output += '│  🖼️  ' + this.colorize('IMAGE FILE', '1').padEnd(42) + '│\n';
        output += '│' + ' '.repeat(50) + '│\n';
        output += '│  Format: ' + format.toUpperCase().padEnd(39) + '│\n';
        output += '│  Size:   ' + size.padEnd(39) + '│\n';
        output += '│  File:   ' + this.truncate(filename, 37).padEnd(39) + '│\n';
        output += '│' + ' '.repeat(50) + '│\n';
        output += '└' + '─'.repeat(50) + '┘\n';
        
        // Suggestion
        output += '\n' + this.colorize('💡 Tip: Use an image viewer to display this file properly', '90');
        
        return output;
    }

    /**
     * Generate image metadata display
     * @param {Object} metadata 
     * @param {string} filename 
     * @returns {string}
     */
    generateImageMetadata(metadata, filename) {
        const format = this.getImageFormat(filename);
        let output = '';
        
        output += this.colorize('File:', '36') + ' ' + filename + '\n';
        output += this.colorize('Type:', '36') + ' ' + format.toUpperCase() + ' Image\n';
        
        if (metadata.size) {
            output += this.colorize('Size:', '36') + ' ' + this.formatFileSize(metadata.size) + '\n';
        }
        
        if (metadata.modified) {
            output += this.colorize('Modified:', '36') + ' ' + new Date(metadata.modified).toLocaleString() + '\n';
        }
        
        // Try to extract basic image info from content
        if (metadata.dimensions) {
            output += this.colorize('Dimensions:', '36') + ' ' + metadata.dimensions.width + 'x' + metadata.dimensions.height + '\n';
        }
        
        output += this.createSeparator() + '\n';
        
        return output;
    }

    /**
     * Get image format from filename
     * @param {string} filename 
     * @returns {string}
     */
    getImageFormat(filename) {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const formats = {
            'jpg': 'JPEG',
            'jpeg': 'JPEG', 
            'png': 'PNG',
            'gif': 'GIF',
            'svg': 'SVG',
            'webp': 'WebP',
            'bmp': 'BMP',
            'tiff': 'TIFF',
            'ico': 'ICO'
        };
        return formats[ext] || ext.toUpperCase();
    }

    /**
     * Check if content is too large for processing
     * @param {string|ArrayBuffer} content 
     * @returns {boolean}
     */
    isContentTooLarge(content) {
        const maxSize = 5 * 1024 * 1024; // 5MB for images
        if (content instanceof ArrayBuffer) {
            return content.byteLength > maxSize;
        }
        return content.length > maxSize;
    }

    /**
     * Render warning for large image files
     * @param {string|ArrayBuffer} content 
     * @param {string} filename 
     * @returns {string}
     */
    renderLargeFileWarning(content, filename) {
        const size = content instanceof ArrayBuffer ? 
            this.formatFileSize(content.byteLength) : 
            this.formatFileSize(content.length);
        
        let output = '';
        
        output += this.colorize('⚠ Image file too large for terminal display', '33') + '\n\n';
        output += this.colorize('File:', '36') + ' ' + filename + '\n';
        output += this.colorize('Size:', '36') + ' ' + size + '\n';
        output += this.colorize('Limit:', '36') + ' ' + this.formatFileSize(5 * 1024 * 1024) + '\n\n';
        
        // Simple file icon
        output += '┌────────────────────┐\n';
        output += '│                    │\n';
        output += '│   🖼️  LARGE IMAGE   │\n';
        output += '│                    │\n';
        output += '│  Use image viewer  │\n';
        output += '│                    │\n';
        output += '└────────────────────┘\n';
        
        return output;
    }

    /**
     * Future method: Load image data for real ASCII conversion
     * This would be implemented with Canvas API or image processing library
     * @param {ArrayBuffer} content 
     * @returns {Promise<ImageData>}
     */
    async loadImageData(content) {
        // Placeholder for future implementation
        // Would use Canvas API:
        // const canvas = document.createElement('canvas');
        // const ctx = canvas.getContext('2d');
        // const img = new Image();
        // return new Promise((resolve, reject) => {
        //     img.onload = () => {
        //         canvas.width = img.width;
        //         canvas.height = img.height;
        //         ctx.drawImage(img, 0, 0);
        //         resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
        //     };
        //     img.onerror = reject;
        //     img.src = URL.createObjectURL(new Blob([content]));
        // });
        
        throw new Error('Image processing not yet implemented');
    }

    /**
     * Future method: Convert image data to ASCII
     * @param {ImageData} imageData 
     * @returns {string}
     */
    imageDataToAscii(imageData) {
        // Placeholder for future implementation
        const { width, height, data } = imageData;
        const chars = this.options.asciiChars;
        let ascii = '';
        
        // Scale down to fit terminal
        const scaleX = width / this.options.asciiWidth;
        const scaleY = height / this.options.asciiHeight;
        
        for (let y = 0; y < this.options.asciiHeight; y++) {
            for (let x = 0; x < this.options.asciiWidth; x++) {
                const sourceX = Math.floor(x * scaleX);
                const sourceY = Math.floor(y * scaleY);
                const index = (sourceY * width + sourceX) * 4;
                
                // Convert to grayscale
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                
                // Apply contrast and brightness
                const adjusted = Math.max(0, Math.min(1, 
                    (gray + this.options.brightnessAdjust) * this.options.contrastBoost
                ));
                
                // Map to ASCII character
                const charIndex = Math.floor(adjusted * (chars.length - 1));
                ascii += chars[charIndex];
            }
            ascii += '\n';
        }
        
        return ascii.trim();
    }
}