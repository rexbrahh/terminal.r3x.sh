import { BaseRenderer } from '../BaseRenderer.js';

/**
 * YAML renderer using js-yaml library
 * Renders YAML data in a structured, colorized terminal format
 */
export class YAMLRenderer extends BaseRenderer {
    constructor(options = {}) {
        super({
            ...options,
            indentSize: options.indentSize || 2,
            maxDepth: options.maxDepth || 10
        });
    }

    canRender(fileType) {
        return fileType === 'yaml' || fileType === 'yml';
    }

    getPriority() {
        return 10;
    }

    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('YAMLRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename);
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateMetadataDisplay(metadata, filename, 'YAML Document');
        }

        // Check if js-yaml is available
        if (typeof jsyaml === 'undefined') {
            return output + this.renderFallback(content);
        }

        try {
            // Parse YAML
            const data = jsyaml.load(content);
            
            // Render the parsed data
            output += this.renderYAMLData(data, 0);
            
        } catch (error) {
            console.error('YAML parsing error:', error);
            output += this.colorize(`⚠ YAML Parsing Error: ${error.message}`, '31') + '\n';
            
            // Show the problematic line if available
            if (error.mark) {
                output += this.colorize(`Line ${error.mark.line + 1}, Column ${error.mark.column + 1}`, '90') + '\n\n';
            }
            
            output += this.renderFallback(content);
        }

        return output;
    }

    renderYAMLData(data, depth = 0) {
        if (depth > this.options.maxDepth) {
            return this.getIndent(depth) + this.colorize('...', '90') + '\n';
        }

        let output = '';
        
        if (data === null || data === undefined) {
            output += this.colorize('null', '90');
        } else if (typeof data === 'boolean') {
            output += this.colorize(String(data), '33'); // Yellow for booleans
        } else if (typeof data === 'number') {
            output += this.colorize(String(data), '33'); // Yellow for numbers
        } else if (typeof data === 'string') {
            output += this.renderString(data);
        } else if (Array.isArray(data)) {
            output += this.renderArray(data, depth);
        } else if (typeof data === 'object') {
            output += this.renderObject(data, depth);
        } else {
            output += String(data);
        }
        
        return output;
    }

    renderString(str) {
        // Check if string needs quotes
        const needsQuotes = /[\n\r\t]/.test(str) || str.trim() !== str;
        
        if (str.includes('\n')) {
            // Multi-line string
            const lines = str.split('\n');
            let output = this.colorize('|', '90') + '\n';
            for (const line of lines) {
                output += '  ' + this.colorize(line, '32') + '\n';
            }
            return output.trimEnd();
        } else if (needsQuotes) {
            return this.colorize(`"${str}"`, '32');
        } else {
            // Check if it looks like a special value
            if (/^(true|false|null|~|yes|no|on|off)$/i.test(str)) {
                return this.colorize(`"${str}"`, '32');
            }
            return this.colorize(str, '32');
        }
    }

    renderArray(arr, depth) {
        if (arr.length === 0) {
            return this.colorize('[]', '90') + '\n';
        }

        let output = '\n';
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            const indent = this.getIndent(depth);
            
            // Array item marker
            output += indent + this.colorize('-', '36') + ' ';
            
            if (this.isPrimitive(item)) {
                output += this.renderYAMLData(item, depth + 1);
                output += '\n';
            } else if (Array.isArray(item)) {
                // Nested array
                const nestedOutput = this.renderYAMLData(item, depth + 1);
                if (nestedOutput.startsWith('\n')) {
                    output += nestedOutput;
                } else {
                    output += '\n' + nestedOutput;
                }
            } else {
                // Nested object in array
                const objOutput = this.renderObject(item, depth + 1, true);
                output += objOutput;
            }
        }
        
        return output;
    }

    renderObject(obj, depth, inArray = false) {
        const keys = Object.keys(obj);
        
        if (keys.length === 0) {
            return this.colorize('{}', '90') + '\n';
        }

        let output = inArray ? '' : '\n';
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = obj[key];
            const indent = inArray && i === 0 ? '' : this.getIndent(depth);
            
            // Key
            output += indent + this.colorize(key, '36') + this.colorize(':', '90') + ' ';
            
            if (this.isPrimitive(value)) {
                output += this.renderYAMLData(value, depth + 1);
                output += '\n';
            } else if (Array.isArray(value)) {
                const arrayOutput = this.renderYAMLData(value, depth + 1);
                if (value.length === 0) {
                    output += arrayOutput;
                } else {
                    output += arrayOutput;
                }
            } else {
                // Nested object
                const nestedOutput = this.renderYAMLData(value, depth + 1);
                if (Object.keys(value).length === 0) {
                    output += nestedOutput;
                } else {
                    output += nestedOutput;
                }
            }
        }
        
        return output;
    }

    isPrimitive(value) {
        return value === null || 
               value === undefined || 
               typeof value === 'string' || 
               typeof value === 'number' || 
               typeof value === 'boolean';
    }

    getIndent(depth) {
        return ' '.repeat(depth * this.options.indentSize);
    }

    renderFallback(content) {
        // Fallback rendering with basic syntax highlighting
        let output = this.colorize('YAML Content (syntax highlighted):', '90') + '\n';
        output += this.colorize('─'.repeat(this.options.maxWidth), '90') + '\n';
        
        const lines = content.split('\n');
        for (const line of lines) {
            let highlighted = line;
            
            // Comments
            if (line.trim().startsWith('#')) {
                highlighted = this.colorize(line, '90');
            }
            // Keys
            else if (line.match(/^[\s]*[\w-]+:/)) {
                const [key, ...rest] = line.split(':');
                highlighted = this.colorize(key, '36') + ':' + rest.join(':');
                
                // Values after keys
                const valueMatch = line.match(/:\s*(.+)$/);
                if (valueMatch) {
                    const value = valueMatch[1];
                    // Numbers
                    if (/^\d+(\.\d+)?$/.test(value.trim())) {
                        highlighted = this.colorize(key, '36') + ': ' + this.colorize(value, '33');
                    }
                    // Booleans
                    else if (/^(true|false|yes|no|on|off)$/i.test(value.trim())) {
                        highlighted = this.colorize(key, '36') + ': ' + this.colorize(value, '33');
                    }
                    // Strings
                    else if (value.trim()) {
                        highlighted = this.colorize(key, '36') + ': ' + this.colorize(value, '32');
                    }
                }
            }
            // List items
            else if (line.trim().startsWith('-')) {
                const marker = line.match(/^(\s*-\s*)/)[0];
                const content = line.substring(marker.length);
                highlighted = marker.replace('-', this.colorize('-', '36')) + content;
            }
            
            output += highlighted + '\n';
        }
        
        return output;
    }

    renderLargeFileWarning(size, filename) {
        return this.colorize('⚠ File too large for rendering', '33') + '\n' +
               `File: ${filename}\n` +
               `Size: ${this.formatFileSize(size)}\n` +
               `Limit: ${this.formatFileSize(1024 * 1024)}\n\n` +
               this.colorize('Consider using a YAML-specific tool for large files.', '90');
    }
}