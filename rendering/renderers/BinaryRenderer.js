import { BaseRenderer } from '../BaseRenderer.js';

/**
 * Binary file renderer with hex dump display and binary analysis
 */
export class BinaryRenderer extends BaseRenderer {
    constructor(options = {}) {
        super({
            bytesPerLine: 16,
            showAddress: true,
            showHex: true,
            showAscii: true,
            showFileInfo: true,
            maxDisplayBytes: 2048, // Only show first 2KB by default
            groupBytes: 2,
            addressWidth: 8,
            highlightPrintable: true,
            ...options
        });
    }

    /**
     * Check if this renderer can handle the file type
     * @param {string} fileType 
     * @returns {boolean}
     */
    canRender(fileType) {
        return fileType === 'binary';
    }

    /**
     * Get renderer priority
     * @returns {number}
     */
    getPriority() {
        return 3; // Lower priority than text-based renderers
    }

    /**
     * Render binary content as hex dump
     * @param {ArrayBuffer|string} content 
     * @param {string} filename 
     * @param {Object} metadata 
     * @returns {Promise<string>}
     */
    async render(content, filename, metadata = {}) {
        // Convert content to Uint8Array for processing
        let bytes;
        if (content instanceof ArrayBuffer) {
            bytes = new Uint8Array(content);
        } else if (typeof content === 'string') {
            // Convert string to bytes (for text files treated as binary)
            bytes = new TextEncoder().encode(content);
        } else {
            throw new Error('BinaryRenderer requires ArrayBuffer or string content');
        }

        if (this.isContentTooLarge(bytes)) {
            return this.renderLargeFileWarning(bytes.length, filename);
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateBinaryMetadata(metadata, filename, bytes);
        }

        // File analysis
        if (this.options.showFileInfo) {
            output += this.generateFileAnalysis(bytes, filename);
        }

        // Hex dump
        output += this.generateHexDump(bytes);

        return output;
    }

    /**
     * Generate binary file metadata
     * @param {Object} metadata 
     * @param {string} filename 
     * @param {Uint8Array} bytes 
     * @returns {string}
     */
    generateBinaryMetadata(metadata, filename, bytes) {
        let output = '';
        
        output += this.colorize('File:', '36') + ' ' + filename + '\n';
        output += this.colorize('Type:', '36') + ' Binary File\n';
        output += this.colorize('Size:', '36') + ' ' + this.formatFileSize(bytes.length) + ' (' + bytes.length + ' bytes)\n';
        
        if (metadata.modified) {
            output += this.colorize('Modified:', '36') + ' ' + new Date(metadata.modified).toLocaleString() + '\n';
        }
        
        output += this.createSeparator() + '\n';
        
        return output;
    }

    /**
     * Generate file analysis information
     * @param {Uint8Array} bytes 
     * @param {string} filename 
     * @returns {string}
     */
    generateFileAnalysis(bytes, filename) {
        let output = '';
        
        output += this.colorize('🔍 Binary File Analysis', '1') + '\n';
        output += this.createSeparator('─', 40) + '\n';
        
        // File type detection from magic numbers
        const fileType = this.detectFileType(bytes);
        output += this.colorize('Detected Type:', '36') + ' ' + fileType + '\n';
        
        // Entropy analysis (measure of randomness)
        const entropy = this.calculateEntropy(bytes.slice(0, Math.min(1024, bytes.length)));
        output += this.colorize('Entropy:', '36') + ' ' + entropy.toFixed(3) + ' (0=uniform, 8=random)\n';
        
        // Byte statistics
        const stats = this.analyzeByteDistribution(bytes.slice(0, Math.min(2048, bytes.length)));
        output += this.colorize('Null bytes:', '36') + ' ' + stats.nullBytes + ' (' + (stats.nullBytes / bytes.length * 100).toFixed(1) + '%)\n';
        output += this.colorize('Printable:', '36') + ' ' + stats.printableBytes + ' (' + (stats.printableBytes / bytes.length * 100).toFixed(1) + '%)\n';
        output += this.colorize('High bytes (>127):', '36') + ' ' + stats.highBytes + ' (' + (stats.highBytes / bytes.length * 100).toFixed(1) + '%)\n';
        
        // String extraction preview
        const strings = this.extractStrings(bytes.slice(0, Math.min(1024, bytes.length)));
        if (strings.length > 0) {
            output += this.colorize('Sample strings:', '36') + ' ' + strings.slice(0, 3).map(s => `"${s}"`).join(', ');
            if (strings.length > 3) {
                output += this.colorize(` ... +${strings.length - 3} more`, '90');
            }
            output += '\n';
        }
        
        output += '\n';
        
        return output;
    }

    /**
     * Detect file type from magic numbers/signatures
     * @param {Uint8Array} bytes 
     * @returns {string}
     */
    detectFileType(bytes) {
        if (bytes.length < 4) return 'Unknown';
        
        const signatures = [
            { pattern: [0x89, 0x50, 0x4E, 0x47], name: 'PNG Image' },
            { pattern: [0xFF, 0xD8, 0xFF], name: 'JPEG Image', partial: true },
            { pattern: [0x47, 0x49, 0x46, 0x38], name: 'GIF Image' },
            { pattern: [0x42, 0x4D], name: 'BMP Image', partial: true },
            { pattern: [0x50, 0x4B, 0x03, 0x04], name: 'ZIP Archive' },
            { pattern: [0x50, 0x4B, 0x05, 0x06], name: 'ZIP Archive (Empty)' },
            { pattern: [0x1F, 0x8B], name: 'GZIP Archive', partial: true },
            { pattern: [0x37, 0x7A, 0xBC, 0xAF], name: '7-Zip Archive' },
            { pattern: [0x52, 0x61, 0x72, 0x21], name: 'RAR Archive' },
            { pattern: [0x25, 0x50, 0x44, 0x46], name: 'PDF Document' },
            { pattern: [0x7F, 0x45, 0x4C, 0x46], name: 'ELF Executable' },
            { pattern: [0x4D, 0x5A], name: 'PE Executable', partial: true },
            { pattern: [0xCA, 0xFE, 0xBA, 0xBE], name: 'Mach-O Executable' },
            { pattern: [0x00, 0x00, 0x00, 0x20], name: 'MP4 Video' },
            { pattern: [0x49, 0x44, 0x33], name: 'MP3 Audio', partial: true },
            { pattern: [0x52, 0x49, 0x46, 0x46], name: 'WAV Audio' },
            { pattern: [0x4F, 0x67, 0x67, 0x53], name: 'OGG Audio' },
            { pattern: [0x66, 0x4C, 0x61, 0x43], name: 'FLAC Audio' }
        ];

        for (const sig of signatures) {
            const matchLength = sig.partial ? sig.pattern.length : sig.pattern.length;
            if (bytes.length >= matchLength) {
                let matches = true;
                for (let i = 0; i < matchLength; i++) {
                    if (bytes[i] !== sig.pattern[i]) {
                        matches = false;
                        break;
                    }
                }
                if (matches) return sig.name;
            }
        }

        // Check for text-based formats
        if (this.isProbablyText(bytes.slice(0, 512))) {
            return 'Text-based file (treated as binary)';
        }

        return 'Unknown binary format';
    }

    /**
     * Check if bytes are probably text
     * @param {Uint8Array} bytes 
     * @returns {boolean}
     */
    isProbablyText(bytes) {
        let printableCount = 0;
        for (const byte of bytes) {
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                printableCount++;
            }
        }
        return (printableCount / bytes.length) > 0.7;
    }

    /**
     * Calculate Shannon entropy of byte sequence
     * @param {Uint8Array} bytes 
     * @returns {number}
     */
    calculateEntropy(bytes) {
        const freq = new Array(256).fill(0);
        for (const byte of bytes) {
            freq[byte]++;
        }

        let entropy = 0;
        const length = bytes.length;
        
        for (let i = 0; i < 256; i++) {
            if (freq[i] > 0) {
                const prob = freq[i] / length;
                entropy -= prob * Math.log2(prob);
            }
        }

        return entropy;
    }

    /**
     * Analyze byte distribution
     * @param {Uint8Array} bytes 
     * @returns {Object}
     */
    analyzeByteDistribution(bytes) {
        let nullBytes = 0;
        let printableBytes = 0;
        let highBytes = 0;

        for (const byte of bytes) {
            if (byte === 0) nullBytes++;
            else if (byte >= 32 && byte <= 126) printableBytes++;
            else if (byte > 127) highBytes++;
        }

        return { nullBytes, printableBytes, highBytes };
    }

    /**
     * Extract readable strings from binary data
     * @param {Uint8Array} bytes 
     * @param {number} minLength 
     * @returns {string[]}
     */
    extractStrings(bytes, minLength = 4) {
        const strings = [];
        let currentString = '';

        for (const byte of bytes) {
            if (byte >= 32 && byte <= 126) {
                currentString += String.fromCharCode(byte);
            } else {
                if (currentString.length >= minLength) {
                    strings.push(currentString);
                }
                currentString = '';
            }
        }

        // Don't forget the last string
        if (currentString.length >= minLength) {
            strings.push(currentString);
        }

        return strings.slice(0, 20); // Limit to first 20 strings
    }

    /**
     * Generate hex dump display
     * @param {Uint8Array} bytes 
     * @returns {string}
     */
    generateHexDump(bytes) {
        let output = '';
        
        // Header
        output += this.colorize('📊 Hex Dump', '1') + '\n';
        
        // Show only first portion if file is large
        const displayBytes = Math.min(bytes.length, this.options.maxDisplayBytes);
        if (displayBytes < bytes.length) {
            output += this.colorize(`[Showing first ${displayBytes} bytes of ${bytes.length}]`, '90') + '\n';
        }
        
        output += this.createSeparator('─', 70) + '\n';
        
        // Column headers
        if (this.options.showAddress && this.options.showHex) {
            let header = '';
            if (this.options.showAddress) {
                header += 'Address'.padEnd(this.options.addressWidth + 2);
            }
            if (this.options.showHex) {
                for (let i = 0; i < this.options.bytesPerLine; i++) {
                    header += i.toString(16).padStart(2, '0') + ' ';
                    if ((i + 1) % this.options.groupBytes === 0 && i < this.options.bytesPerLine - 1) {
                        header += ' ';
                    }
                }
                header = header.trim();
                if (this.options.showAscii) {
                    header += '  ASCII';
                }
            }
            output += this.colorize(header, '90') + '\n';
            output += this.createSeparator('─', header.length) + '\n';
        }

        // Hex dump lines
        for (let offset = 0; offset < displayBytes; offset += this.options.bytesPerLine) {
            let line = '';
            
            // Address column
            if (this.options.showAddress) {
                const address = offset.toString(16).padStart(this.options.addressWidth, '0');
                line += this.colorize(address, '36') + ': ';
            }
            
            // Hex columns
            if (this.options.showHex) {
                for (let i = 0; i < this.options.bytesPerLine; i++) {
                    const byteIndex = offset + i;
                    if (byteIndex < displayBytes) {
                        const byte = bytes[byteIndex];
                        const hex = byte.toString(16).padStart(2, '0');
                        
                        // Color coding for different byte ranges
                        let color = '37'; // White
                        if (byte === 0) color = '90';         // Gray for null bytes
                        else if (byte < 32) color = '31';     // Red for control chars
                        else if (byte >= 32 && byte <= 126) color = '32'; // Green for printable
                        else color = '33';                    // Yellow for high bytes
                        
                        line += this.colorize(hex, color) + ' ';
                    } else {
                        line += '   '; // Empty space for incomplete lines
                    }
                    
                    // Add extra space between groups
                    if ((i + 1) % this.options.groupBytes === 0 && i < this.options.bytesPerLine - 1) {
                        line += ' ';
                    }
                }
            }
            
            // ASCII column
            if (this.options.showAscii) {
                line += ' │';
                for (let i = 0; i < this.options.bytesPerLine; i++) {
                    const byteIndex = offset + i;
                    if (byteIndex < displayBytes) {
                        const byte = bytes[byteIndex];
                        let char;
                        let color = '37';
                        
                        if (byte >= 32 && byte <= 126) {
                            char = String.fromCharCode(byte);
                            if (this.options.highlightPrintable) {
                                color = '32'; // Green for printable
                            }
                        } else {
                            char = '·';
                            color = '90'; // Gray for non-printable
                        }
                        
                        line += this.colorize(char, color);
                    } else {
                        line += ' ';
                    }
                }
                line += '│';
            }
            
            output += line + '\n';
        }
        
        // Footer if truncated
        if (displayBytes < bytes.length) {
            output += '\n' + this.colorize(`... ${bytes.length - displayBytes} more bytes not shown`, '90') + '\n';
            output += this.colorize('💡 Tip: Adjust maxDisplayBytes option to show more data', '90');
        }
        
        return output;
    }

    /**
     * Check if content is too large for processing
     * @param {Uint8Array} bytes 
     * @returns {boolean}
     */
    isContentTooLarge(bytes) {
        const maxSize = 10 * 1024 * 1024; // 10MB limit for binary files
        return bytes.length > maxSize;
    }

    /**
     * Render warning for large binary files
     * @param {number} size 
     * @param {string} filename 
     * @returns {string}
     */
    renderLargeFileWarning(size, filename) {
        let output = '';
        
        output += this.colorize('⚠ Binary file too large for hex dump display', '33') + '\n\n';
        output += this.colorize('File:', '36') + ' ' + filename + '\n';
        output += this.colorize('Size:', '36') + ' ' + this.formatFileSize(size) + '\n';
        output += this.colorize('Limit:', '36') + ' ' + this.formatFileSize(10 * 1024 * 1024) + '\n\n';
        
        // Simple binary file representation
        output += '┌────────────────────────┐\n';
        output += '│                        │\n';
        output += '│    📦 LARGE BINARY     │\n';
        output += '│                        │\n';
        output += '│   Use hex editor or    │\n';
        output += '│   specialized tool     │\n';
        output += '│                        │\n';
        output += '└────────────────────────┘\n';
        
        return output;
    }
}