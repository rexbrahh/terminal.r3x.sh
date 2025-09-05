import { FileTypeDetector } from './FileTypeDetector.js';

/**
 * Registry for managing file renderers
 * Handles renderer registration, discovery, and selection
 */
export class RendererRegistry {
    constructor() {
        this.renderers = new Map(); // fileType -> renderer[]
        this.defaultOptions = {
            maxWidth: 80,
            colorOutput: true,
            interactive: false,
        };
    }

    /**
     * Register a renderer for specific file types
     * @param {BaseRenderer} renderer - The renderer instance
     * @param {string|string[]} fileTypes - File type(s) this renderer handles
     */
    register(renderer, fileTypes) {
        const types = Array.isArray(fileTypes) ? fileTypes : [fileTypes];
        
        for (const fileType of types) {
            if (!this.renderers.has(fileType)) {
                this.renderers.set(fileType, []);
            }
            
            const renderersForType = this.renderers.get(fileType);
            
            // Insert renderer based on priority (higher priority first)
            const priority = renderer.getPriority();
            const insertIndex = renderersForType.findIndex(r => r.getPriority() < priority);
            
            if (insertIndex === -1) {
                renderersForType.push(renderer);
            } else {
                renderersForType.splice(insertIndex, 0, renderer);
            }
        }
    }

    /**
     * Get the best renderer for a file
     * @param {string} filename 
     * @param {string|ArrayBuffer} content 
     * @param {Object} options - Rendering options
     * @returns {BaseRenderer|null}
     */
    getRenderer(filename, content, options = {}) {
        // Detect file type
        const fileType = FileTypeDetector.detect(filename, content);
        
        // Find renderers for this file type
        const candidates = this.renderers.get(fileType) || [];
        
        // Return the highest priority renderer that can handle this type
        for (const renderer of candidates) {
            if (renderer.canRender(fileType)) {
                // Create a copy with merged options
                const mergedOptions = { ...this.defaultOptions, ...options };
                renderer.options = { ...renderer.options, ...mergedOptions };
                return renderer;
            }
        }
        
        // Fallback: try to find a generic text renderer
        if (fileType !== 'text') {
            return this.getRenderer(filename, content, { ...options, fallback: true });
        }
        
        return null;
    }

    /**
     * Render a file using the appropriate renderer
     * @param {string} filename 
     * @param {string|ArrayBuffer} content 
     * @param {Object} metadata 
     * @param {Object} options 
     * @returns {Promise<string>}
     */
    async render(filename, content, metadata = {}, options = {}) {
        const renderer = this.getRenderer(filename, content, options);
        
        if (!renderer) {
            return this.renderFallback(filename, content, metadata);
        }
        
        try {
            const result = await renderer.render(content, filename, metadata);
            return result;
        } catch (error) {
            console.error(`Renderer ${renderer.getName()} failed:`, error);
            return this.renderFallback(filename, content, metadata, error);
        }
    }

    /**
     * Fallback rendering when no suitable renderer is found
     * @param {string} filename 
     * @param {string|ArrayBuffer} content 
     * @param {Object} metadata 
     * @param {Error} error 
     * @returns {string}
     */
    renderFallback(filename, content, metadata, error = null) {
        let output = '';
        
        // Show error if provided
        if (error) {
            output += `\x1b[31mRenderer Error: ${error.message}\x1b[0m\n`;
            output += `\x1b[90mFalling back to basic text display...\x1b[0m\n\n`;
        }
        
        // Show basic file info
        const fileType = FileTypeDetector.detect(filename, content);
        output += `\x1b[36mFile:\x1b[0m ${filename}\n`;
        output += `\x1b[36mType:\x1b[0m ${FileTypeDetector.getDescription(fileType)}\n`;
        
        if (metadata.size) {
            output += `\x1b[36mSize:\x1b[0m ${this.formatFileSize(metadata.size)}\n`;
        }
        
        output += '─'.repeat(60) + '\n';
        
        // Handle different content types
        if (content instanceof ArrayBuffer) {
            output += this.renderBinaryFallback(content);
        } else if (typeof content === 'string') {
            if (content.length > 10000) {
                const preview = content.substring(0, 1000);
                output += preview + '\n\n';
                output += `\x1b[90m[Content truncated - showing first 1000 of ${content.length} characters]\x1b[0m`;
            } else {
                output += content;
            }
        } else {
            output += '\x1b[31m[Unable to display content]\x1b[0m';
        }
        
        return output;
    }

    /**
     * Basic binary content rendering
     * @param {ArrayBuffer} content 
     * @returns {string}
     */
    renderBinaryFallback(content) {
        const bytes = new Uint8Array(content);
        const maxBytes = 256; // Show first 256 bytes
        const showBytes = Math.min(maxBytes, bytes.length);
        
        let output = '\x1b[90m[Binary content - hex dump of first ' + showBytes + ' bytes]\x1b[0m\n\n';
        
        for (let i = 0; i < showBytes; i += 16) {
            // Address
            const address = i.toString(16).padStart(8, '0');
            output += `\x1b[36m${address}:\x1b[0m `;
            
            // Hex bytes
            for (let j = 0; j < 16; j++) {
                if (i + j < showBytes) {
                    const byte = bytes[i + j];
                    output += byte.toString(16).padStart(2, '0') + ' ';
                } else {
                    output += '   ';
                }
                
                if (j === 7) output += ' '; // Extra space in middle
            }
            
            output += ' ';
            
            // ASCII representation
            for (let j = 0; j < 16 && i + j < showBytes; j++) {
                const byte = bytes[i + j];
                const char = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
                output += char;
            }
            
            output += '\n';
        }
        
        if (bytes.length > maxBytes) {
            output += `\n\x1b[90m[... ${bytes.length - maxBytes} more bytes]\x1b[0m`;
        }
        
        return output;
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
     * Get all registered file types
     * @returns {string[]}
     */
    getSupportedFileTypes() {
        return Array.from(this.renderers.keys());
    }

    /**
     * Get renderers for a specific file type
     * @param {string} fileType 
     * @returns {BaseRenderer[]}
     */
    getRenderersForType(fileType) {
        return this.renderers.get(fileType) || [];
    }

    /**
     * Get statistics about registered renderers
     * @returns {Object}
     */
    getStats() {
        const stats = {
            totalRenderers: 0,
            fileTypesSupported: this.renderers.size,
            renderersByType: {}
        };
        
        for (const [fileType, renderers] of this.renderers.entries()) {
            stats.totalRenderers += renderers.length;
            stats.renderersByType[fileType] = renderers.length;
        }
        
        return stats;
    }

    /**
     * Clear all registered renderers
     */
    clear() {
        this.renderers.clear();
    }

    /**
     * Remove renderers for specific file type
     * @param {string} fileType 
     */
    unregister(fileType) {
        this.renderers.delete(fileType);
    }

    /**
     * Set default options for all renderers
     * @param {Object} options 
     */
    setDefaultOptions(options) {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }
}