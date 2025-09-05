import { BaseRenderer } from '../BaseRenderer.js';

/**
 * JSON renderer with pretty printing, syntax highlighting, and structure analysis
 */
export class JSONRenderer extends BaseRenderer {
    constructor(options = {}) {
        super({
            indent: 2,
            maxDepth: 10,
            maxArrayPreview: 5,
            showTypes: true,
            highlightKeys: true,
            ...options
        });
    }

    /**
     * Check if this renderer can handle the file type
     * @param {string} fileType 
     * @returns {boolean}
     */
    canRender(fileType) {
        return fileType === 'json';
    }

    /**
     * Get renderer priority
     * @returns {number}
     */
    getPriority() {
        return 9; // High priority for JSON files
    }

    /**
     * Render JSON content
     * @param {string} content 
     * @param {string} filename 
     * @param {Object} metadata 
     * @returns {Promise<string>}
     */
    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('JSONRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename);
        }

        let output = '';

        try {
            // Parse JSON
            const jsonData = JSON.parse(content);

            // Add metadata
            if (this.options.showMetadata) {
                output += this.generateJSONMetadata(jsonData, metadata, filename);
            }

            // Add structure overview
            output += this.generateStructureOverview(jsonData);
            output += '\n';

            // Render formatted JSON
            output += this.formatJSON(jsonData, 0);

        } catch (error) {
            // Handle invalid JSON
            output += this.renderInvalidJSON(content, filename, error);
        }

        return output;
    }

    /**
     * Generate JSON metadata and statistics
     * @param {any} data 
     * @param {Object} metadata 
     * @param {string} filename 
     * @returns {string}
     */
    generateJSONMetadata(data, metadata, filename) {
        let output = '';
        
        output += this.colorize('File:', '36') + ' ' + filename + '\n';
        output += this.colorize('Type:', '36') + ' JSON Document\n';
        
        if (metadata.size) {
            output += this.colorize('Size:', '36') + ' ' + this.formatFileSize(metadata.size) + '\n';
        }
        
        // JSON-specific statistics
        const stats = this.analyzeJSONStructure(data);
        output += this.colorize('Keys:', '36') + ' ' + stats.totalKeys + '\n';
        output += this.colorize('Depth:', '36') + ' ' + stats.maxDepth + ' levels\n';
        
        if (stats.arrays > 0) {
            output += this.colorize('Arrays:', '36') + ' ' + stats.arrays + '\n';
        }
        
        if (stats.objects > 0) {
            output += this.colorize('Objects:', '36') + ' ' + stats.objects + '\n';
        }
        
        output += this.createSeparator() + '\n';
        
        return output;
    }

    /**
     * Generate structure overview
     * @param {any} data 
     * @returns {string}
     */
    generateStructureOverview(data) {
        let output = '';
        
        output += this.colorize('📋 JSON Structure Overview', '1') + '\n';
        output += this.createSeparator('─', 40) + '\n';
        
        if (Array.isArray(data)) {
            output += `${this.colorize('Type:', '36')} Array with ${data.length} items\n`;
            if (data.length > 0) {
                const itemTypes = this.getArrayItemTypes(data);
                output += `${this.colorize('Items:', '36')} ${itemTypes}\n`;
            }
        } else if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            output += `${this.colorize('Type:', '36')} Object with ${keys.length} properties\n`;
            
            if (keys.length > 0) {
                const preview = keys.slice(0, 5).map(key => `"${key}"`).join(', ');
                const more = keys.length > 5 ? ` ... +${keys.length - 5} more` : '';
                output += `${this.colorize('Keys:', '36')} ${preview}${more}\n`;
            }
        } else {
            output += `${this.colorize('Type:', '36')} ${this.getValueType(data)}\n`;
            output += `${this.colorize('Value:', '36')} ${this.formatValuePreview(data)}\n`;
        }
        
        return output;
    }

    /**
     * Get array item types summary
     * @param {Array} array 
     * @returns {string}
     */
    getArrayItemTypes(array) {
        const typeCounts = {};
        const sampleSize = Math.min(array.length, 20);
        
        for (let i = 0; i < sampleSize; i++) {
            const type = this.getValueType(array[i]);
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
        
        const typeStrings = Object.entries(typeCounts)
            .map(([type, count]) => `${type}(${count})`)
            .join(', ');
        
        return array.length > sampleSize ? typeStrings + ' ...' : typeStrings;
    }

    /**
     * Format JSON with syntax highlighting and indentation
     * @param {any} data 
     * @param {number} depth 
     * @param {boolean} isLastItem 
     * @returns {string}
     */
    formatJSON(data, depth, isLastItem = true) {
        const indent = ' '.repeat(depth * this.options.indent);
        
        if (depth > this.options.maxDepth) {
            return this.colorize('[Max depth exceeded]', '90');
        }
        
        switch (typeof data) {
            case 'string':
                return this.colorize(`"${this.escapeString(data)}"`, '32'); // Green
            
            case 'number':
                return this.colorize(String(data), '33'); // Yellow
            
            case 'boolean':
                return this.colorize(String(data), '35'); // Magenta
            
            case 'object':
                if (data === null) {
                    return this.colorize('null', '90'); // Gray
                }
                
                if (Array.isArray(data)) {
                    return this.formatArray(data, depth, indent);
                }
                
                return this.formatObject(data, depth, indent);
            
            default:
                return this.colorize('undefined', '90');
        }
    }

    /**
     * Format JSON array
     * @param {Array} array 
     * @param {number} depth 
     * @param {string} baseIndent 
     * @returns {string}
     */
    formatArray(array, depth, baseIndent) {
        if (array.length === 0) {
            return this.colorize('[]', '90');
        }
        
        let output = this.colorize('[', '90') + '\n';
        
        // Show preview of items or all items if small
        const showCount = Math.min(array.length, this.options.maxArrayPreview);
        
        for (let i = 0; i < showCount; i++) {
            const itemIndent = ' '.repeat((depth + 1) * this.options.indent);
            const isLast = i === showCount - 1 && showCount === array.length;
            
            output += itemIndent;
            output += this.formatJSON(array[i], depth + 1, isLast);
            
            if (!isLast || showCount < array.length) {
                output += this.colorize(',', '90');
            }
            
            // Add type annotation for complex items
            if (this.options.showTypes && (typeof array[i] === 'object') && array[i] !== null) {
                const type = Array.isArray(array[i]) ? 
                    `Array(${array[i].length})` : 
                    `Object(${Object.keys(array[i]).length} keys)`;
                output += this.colorize(` // ${type}`, '90');
            }
            
            output += '\n';
        }
        
        // Show truncation message if needed
        if (showCount < array.length) {
            const itemIndent = ' '.repeat((depth + 1) * this.options.indent);
            output += itemIndent + this.colorize(`... ${array.length - showCount} more items`, '90') + '\n';
        }
        
        output += baseIndent + this.colorize(']', '90');
        return output;
    }

    /**
     * Format JSON object
     * @param {Object} obj 
     * @param {number} depth 
     * @param {string} baseIndent 
     * @returns {string}
     */
    formatObject(obj, depth, baseIndent) {
        const keys = Object.keys(obj);
        
        if (keys.length === 0) {
            return this.colorize('{}', '90');
        }
        
        let output = this.colorize('{', '90') + '\n';
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = obj[key];
            const itemIndent = ' '.repeat((depth + 1) * this.options.indent);
            const isLast = i === keys.length - 1;
            
            output += itemIndent;
            
            // Colorize key
            if (this.options.highlightKeys) {
                output += this.colorize(`"${key}"`, '36'); // Cyan
            } else {
                output += `"${key}"`;
            }
            
            output += this.colorize(': ', '90');
            output += this.formatJSON(value, depth + 1, isLast);
            
            if (!isLast) {
                output += this.colorize(',', '90');
            }
            
            // Add type annotation for the value
            if (this.options.showTypes && (typeof value === 'object') && value !== null) {
                const type = Array.isArray(value) ? 
                    `Array(${value.length})` : 
                    `Object(${Object.keys(value).length} keys)`;
                output += this.colorize(` // ${type}`, '90');
            }
            
            output += '\n';
        }
        
        output += baseIndent + this.colorize('}', '90');
        return output;
    }

    /**
     * Escape string for JSON display
     * @param {string} str 
     * @returns {string}
     */
    escapeString(str) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    /**
     * Get human-readable type of value
     * @param {any} value 
     * @returns {string}
     */
    getValueType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * Format value preview for overview
     * @param {any} value 
     * @returns {string}
     */
    formatValuePreview(value) {
        if (typeof value === 'string') {
            return this.truncate(`"${value}"`, 50);
        }
        return String(value);
    }

    /**
     * Analyze JSON structure for statistics
     * @param {any} data 
     * @param {number} depth 
     * @returns {Object}
     */
    analyzeJSONStructure(data, depth = 0) {
        const stats = {
            totalKeys: 0,
            maxDepth: depth,
            objects: 0,
            arrays: 0,
            strings: 0,
            numbers: 0,
            booleans: 0,
            nulls: 0
        };

        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data)) {
                stats.arrays++;
                for (const item of data) {
                    const itemStats = this.analyzeJSONStructure(item, depth + 1);
                    this.mergeStats(stats, itemStats);
                }
            } else {
                stats.objects++;
                const keys = Object.keys(data);
                stats.totalKeys += keys.length;
                
                for (const key of keys) {
                    const valueStats = this.analyzeJSONStructure(data[key], depth + 1);
                    this.mergeStats(stats, valueStats);
                }
            }
        } else {
            // Primitive value
            switch (typeof data) {
                case 'string': stats.strings++; break;
                case 'number': stats.numbers++; break;
                case 'boolean': stats.booleans++; break;
                default:
                    if (data === null) stats.nulls++;
            }
        }

        return stats;
    }

    /**
     * Merge statistics objects
     * @param {Object} target 
     * @param {Object} source 
     */
    mergeStats(target, source) {
        target.totalKeys += source.totalKeys;
        target.maxDepth = Math.max(target.maxDepth, source.maxDepth);
        target.objects += source.objects;
        target.arrays += source.arrays;
        target.strings += source.strings;
        target.numbers += source.numbers;
        target.booleans += source.booleans;
        target.nulls += source.nulls;
    }

    /**
     * Render invalid JSON with error information
     * @param {string} content 
     * @param {string} filename 
     * @param {Error} error 
     * @returns {string}
     */
    renderInvalidJSON(content, filename, error) {
        let output = '';
        
        // Error header
        output += this.colorize('❌ Invalid JSON', '31') + '\n\n';
        output += this.colorize('File:', '36') + ' ' + filename + '\n';
        output += this.colorize('Error:', '36') + ' ' + error.message + '\n\n';
        
        // Try to show error location
        const errorMatch = error.message.match(/position (\d+)/);
        if (errorMatch) {
            const position = parseInt(errorMatch[1]);
            output += this.showErrorContext(content, position);
        }
        
        // Show raw content (truncated)
        output += this.colorize('Raw Content (first 500 characters):', '33') + '\n';
        output += this.createSeparator() + '\n';
        
        const preview = content.length > 500 ? 
            content.substring(0, 500) + this.colorize('\n[... truncated]', '90') :
            content;
        
        output += preview;
        
        return output;
    }

    /**
     * Show context around JSON parse error
     * @param {string} content 
     * @param {number} position 
     * @returns {string}
     */
    showErrorContext(content, position) {
        const contextSize = 50;
        const start = Math.max(0, position - contextSize);
        const end = Math.min(content.length, position + contextSize);
        
        const before = content.substring(start, position);
        const after = content.substring(position, end);
        
        let output = this.colorize('Error Location:', '33') + '\n';
        output += this.createSeparator() + '\n';
        
        // Line number calculation
        const beforeNewlines = content.substring(0, position).match(/\n/g);
        const lineNumber = beforeNewlines ? beforeNewlines.length + 1 : 1;
        
        output += this.colorize(`Line ${lineNumber}:`, '90') + ' ';
        output += before;
        output += this.colorize('❌', '31'); // Error marker
        output += after + '\n';
        
        return output + '\n';
    }

    /**
     * Render warning for large JSON files
     * @param {number} size 
     * @param {string} filename 
     * @returns {string}
     */
    renderLargeFileWarning(size, filename) {
        return this.colorize('⚠ JSON file too large for pretty printing', '33') + '\n' +
               `File: ${filename}\n` +
               `Size: ${this.formatFileSize(size)}\n` +
               `Limit: ${this.formatFileSize(1024 * 1024)}\n\n` +
               this.colorize('Use a JSON viewer for large files.', '90');
    }
}