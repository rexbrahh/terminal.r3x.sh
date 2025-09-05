export class FileTypeDetector {
    static extensionMap = {
        // Markdown
        '.md': 'markdown',
        '.markdown': 'markdown',
        
        // Images
        '.jpg': 'image',
        '.jpeg': 'image',
        '.png': 'image',
        '.gif': 'image',
        '.svg': 'image',
        '.webp': 'image',
        '.bmp': 'image',
        
        // Code files
        '.js': 'javascript',
        '.ts': 'typescript',
        '.jsx': 'javascript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.sh': 'bash',
        '.bash': 'bash',
        '.zsh': 'bash',
        '.fish': 'bash',
        '.ps1': 'powershell',
        '.html': 'html',
        '.htm': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.toml': 'toml',
        '.ini': 'ini',
        '.cfg': 'ini',
        '.conf': 'config',
        
        // Data formats
        '.json': 'json',
        '.csv': 'csv',
        '.tsv': 'tsv',
        
        // Documents
        '.txt': 'text',
        '.log': 'log',
        '.pdf': 'pdf',
        
        // Archives
        '.zip': 'zip',
        '.tar': 'archive',
        '.gz': 'archive',
        '.7z': 'archive',
        '.rar': 'archive',
        '.jar': 'jar',
        '.war': 'war',
        '.ear': 'ear',
        
        // Binary
        '.exe': 'binary',
        '.dll': 'binary',
        '.so': 'binary',
        '.dylib': 'binary',
    };

    /**
     * Detect file type based on filename and content
     * @param {string} filename - The file name
     * @param {string|ArrayBuffer} content - The file content
     * @returns {string} - The detected file type
     */
    static detect(filename, content) {
        // First try extension-based detection
        const extensionType = this.detectByExtension(filename);
        if (extensionType !== 'unknown') {
            return extensionType;
        }
        
        // Fallback to content-based detection
        return this.detectByContent(content);
    }
    
    /**
     * Detect file type by extension
     * @param {string} filename 
     * @returns {string}
     */
    static detectByExtension(filename) {
        const extension = this.getExtension(filename);
        return this.extensionMap[extension] || 'unknown';
    }
    
    /**
     * Detect file type by content analysis
     * @param {string|ArrayBuffer} content 
     * @returns {string}
     */
    static detectByContent(content) {
        if (!content) return 'empty';
        
        // Convert to string if it's ArrayBuffer
        let textContent = '';
        if (content instanceof ArrayBuffer) {
            const bytes = new Uint8Array(content);
            
            // Check for binary file signatures (magic numbers)
            if (this.isBinaryContent(bytes)) {
                return this.detectBinaryType(bytes);
            }
            
            // Try to decode as text
            try {
                textContent = new TextDecoder('utf-8').decode(bytes);
            } catch (e) {
                return 'binary';
            }
        } else {
            textContent = content;
        }
        
        // Text-based content analysis
        return this.detectTextType(textContent);
    }
    
    /**
     * Check if content is binary
     * @param {Uint8Array} bytes 
     * @returns {boolean}
     */
    static isBinaryContent(bytes) {
        // Check for null bytes (common in binary files)
        for (let i = 0; i < Math.min(8192, bytes.length); i++) {
            if (bytes[i] === 0) return true;
        }
        
        // Check for high ratio of non-printable characters
        let printable = 0;
        const sampleSize = Math.min(1024, bytes.length);
        
        for (let i = 0; i < sampleSize; i++) {
            const byte = bytes[i];
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                printable++;
            }
        }
        
        return (printable / sampleSize) < 0.7;
    }
    
    /**
     * Detect binary file type by magic numbers
     * @param {Uint8Array} bytes 
     * @returns {string}
     */
    static detectBinaryType(bytes) {
        // Common binary file signatures
        const signatures = [
            { bytes: [0xFF, 0xD8, 0xFF], type: 'image' }, // JPEG
            { bytes: [0x89, 0x50, 0x4E, 0x47], type: 'image' }, // PNG
            { bytes: [0x47, 0x49, 0x46], type: 'image' }, // GIF
            { bytes: [0x25, 0x50, 0x44, 0x46], type: 'pdf' }, // PDF
            { bytes: [0x50, 0x4B], type: 'archive' }, // ZIP
            { bytes: [0x7F, 0x45, 0x4C, 0x46], type: 'binary' }, // ELF
        ];
        
        for (const sig of signatures) {
            if (bytes.length >= sig.bytes.length) {
                const matches = sig.bytes.every((byte, i) => bytes[i] === byte);
                if (matches) return sig.type;
            }
        }
        
        return 'binary';
    }
    
    /**
     * Detect text file type by content patterns
     * @param {string} content 
     * @returns {string}
     */
    static detectTextType(content) {
        const firstLines = content.split('\n').slice(0, 10).join('\n');
        
        // JSON detection
        if (this.isJSON(content)) return 'json';
        
        // XML detection
        if (content.trim().startsWith('<?xml') || content.includes('</')) return 'xml';
        
        // HTML detection
        if (content.includes('<!DOCTYPE html') || content.includes('<html')) return 'html';
        
        // YAML detection
        if (this.isYAML(firstLines)) return 'yaml';
        
        // Markdown detection (headers, lists, links)
        if (this.isMarkdown(content)) return 'markdown';
        
        // Code detection (shebangs, common patterns)
        const shebang = content.trim().split('\n')[0];
        if (shebang.startsWith('#!')) {
            if (shebang.includes('python')) return 'python';
            if (shebang.includes('node') || shebang.includes('javascript')) return 'javascript';
            if (shebang.includes('bash') || shebang.includes('sh')) return 'bash';
        }
        
        // Log file detection
        if (this.isLogFile(firstLines)) return 'log';
        
        // Default to plain text
        return 'text';
    }
    
    /**
     * Check if content is valid JSON
     * @param {string} content 
     * @returns {boolean}
     */
    static isJSON(content) {
        try {
            JSON.parse(content);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Check if content looks like YAML
     * @param {string} content 
     * @returns {boolean}
     */
    static isYAML(content) {
        const lines = content.split('\n').filter(line => line.trim());
        let yamlPatterns = 0;
        
        for (const line of lines.slice(0, 5)) {
            // YAML patterns: key: value, - list items, etc.
            if (line.match(/^[\w-]+:\s/) || line.match(/^\s*-\s/) || line.match(/^\s{2,}\w/)) {
                yamlPatterns++;
            }
        }
        
        return yamlPatterns >= 2;
    }
    
    /**
     * Check if content looks like Markdown
     * @param {string} content 
     * @returns {boolean}
     */
    static isMarkdown(content) {
        const patterns = [
            /^#{1,6}\s+/, // Headers
            /^\s*[-*+]\s+/, // Lists
            /\[.*\]\(.*\)/, // Links
            /\*\*.*\*\*/, // Bold
            /^```/, // Code blocks
        ];
        
        return patterns.some(pattern => pattern.test(content));
    }
    
    /**
     * Check if content looks like a log file
     * @param {string} content 
     * @returns {boolean}
     */
    static isLogFile(content) {
        const lines = content.split('\n').slice(0, 5);
        let logPatterns = 0;
        
        for (const line of lines) {
            // Common log patterns: timestamps, log levels
            if (line.match(/^\d{4}-\d{2}-\d{2}/) || 
                line.match(/\b(ERROR|WARN|INFO|DEBUG|TRACE)\b/) ||
                line.match(/^\[\d{4}-\d{2}-\d{2}/)) {
                logPatterns++;
            }
        }
        
        return logPatterns >= 2;
    }
    
    /**
     * Extract file extension from filename
     * @param {string} filename 
     * @returns {string}
     */
    static getExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1 || lastDot === filename.length - 1) return '';
        return filename.substring(lastDot).toLowerCase();
    }
    
    /**
     * Check if a file type is considered code
     * @param {string} fileType 
     * @returns {boolean}
     */
    static isCodeType(fileType) {
        const codeTypes = [
            'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 
            'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
            'scala', 'bash', 'powershell', 'html', 'css', 'scss',
            'sass', 'less', 'xml', 'yaml', 'toml', 'ini', 'config'
        ];
        return codeTypes.includes(fileType);
    }
    
    /**
     * Get human-readable description of file type
     * @param {string} fileType 
     * @returns {string}
     */
    static getDescription(fileType) {
        const descriptions = {
            'markdown': 'Markdown Document',
            'image': 'Image File',
            'javascript': 'JavaScript Source',
            'typescript': 'TypeScript Source',
            'python': 'Python Script',
            'json': 'JSON Data',
            'text': 'Plain Text',
            'binary': 'Binary File',
            'pdf': 'PDF Document',
            'archive': 'Archive File',
            'log': 'Log File',
            'html': 'HTML Document',
            'css': 'CSS Stylesheet',
            'xml': 'XML Document',
            'yaml': 'YAML Configuration',
            'csv': 'CSV Data',
            'tsv': 'TSV Data',
            'zip': 'ZIP Archive',
            'jar': 'Java Archive',
            'war': 'Web Application Archive',
            'ear': 'Enterprise Application Archive',
        };
        
        return descriptions[fileType] || 'Unknown File Type';
    }
}