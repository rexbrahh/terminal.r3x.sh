import { BaseRenderer } from '../BaseRenderer.js';

/**
 * Archive renderer using JSZip library
 * Displays contents of ZIP and other archive files
 */
export class ArchiveRenderer extends BaseRenderer {
    constructor(options = {}) {
        super({
            ...options,
            maxFiles: options.maxFiles || 100,
            showHidden: options.showHidden || false
        });
    }

    canRender(fileType) {
        return fileType === 'zip' || fileType === 'archive' || 
               fileType === 'jar' || fileType === 'war' || fileType === 'ear';
    }

    getPriority() {
        return 10;
    }

    async render(content, filename, metadata = {}) {
        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateMetadataDisplay(metadata, filename, 'Archive File');
        }

        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            return output + this.renderUnavailable(filename);
        }

        try {
            // Create JSZip instance and load the content
            const zip = new JSZip();
            
            // Content might be ArrayBuffer or base64 string
            let loadPromise;
            if (content instanceof ArrayBuffer) {
                loadPromise = zip.loadAsync(content);
            } else if (typeof content === 'string') {
                // Try to decode as base64
                loadPromise = zip.loadAsync(content, { base64: true });
            } else {
                throw new Error('Unsupported content type for archive');
            }

            await loadPromise;
            
            // Get file list
            const files = [];
            zip.forEach((relativePath, file) => {
                // Skip hidden files if not requested
                if (!this.options.showHidden && relativePath.startsWith('.')) {
                    return;
                }
                
                files.push({
                    path: relativePath,
                    dir: file.dir,
                    date: file.date,
                    size: file._data ? file._data.uncompressedSize : 0,
                    compressedSize: file._data ? file._data.compressedSize : 0,
                    comment: file.comment || ''
                });
            });

            // Sort files: directories first, then alphabetically
            files.sort((a, b) => {
                if (a.dir && !b.dir) return -1;
                if (!a.dir && b.dir) return 1;
                return a.path.localeCompare(b.path);
            });

            // Render the archive contents
            output += this.renderArchiveContents(files, filename);
            
        } catch (error) {
            console.error('Archive processing error:', error);
            output += this.colorize(`⚠ Error reading archive: ${error.message}`, '31') + '\n\n';
            output += this.renderUnavailable(filename);
        }

        return output;
    }

    renderArchiveContents(files, archiveName) {
        let output = '';
        
        // Archive summary
        const totalFiles = files.filter(f => !f.dir).length;
        const totalDirs = files.filter(f => f.dir).length;
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const totalCompressed = files.reduce((sum, f) => sum + f.compressedSize, 0);
        
        output += this.colorize('Archive Contents:', '36') + '\n';
        output += this.colorize('─'.repeat(this.options.maxWidth), '90') + '\n';
        output += `Files: ${totalFiles} | Directories: ${totalDirs} | `;
        output += `Size: ${this.formatFileSize(totalSize)} | `;
        output += `Compressed: ${this.formatFileSize(totalCompressed)}`;
        
        if (totalSize > 0) {
            const ratio = ((1 - totalCompressed / totalSize) * 100).toFixed(1);
            output += ` (${ratio}% compression)`;
        }
        output += '\n\n';

        // Build directory tree
        const tree = this.buildDirectoryTree(files);
        output += this.renderTree(tree, '');

        // Show truncation notice if needed
        if (files.length > this.options.maxFiles) {
            output += '\n' + this.colorize(`... showing first ${this.options.maxFiles} entries`, '90');
        }

        return output;
    }

    buildDirectoryTree(files) {
        const tree = { name: '/', children: {}, files: [], isDir: true };
        
        for (const file of files.slice(0, this.options.maxFiles)) {
            const parts = file.path.split('/').filter(p => p);
            let current = tree;
            
            // Navigate/create directory structure
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current.children[part]) {
                    current.children[part] = {
                        name: part,
                        children: {},
                        files: [],
                        isDir: true
                    };
                }
                current = current.children[part];
            }
            
            // Add file to the appropriate directory
            if (!file.dir) {
                const fileName = parts[parts.length - 1];
                current.files.push({
                    name: fileName,
                    size: file.size,
                    date: file.date,
                    compressedSize: file.compressedSize
                });
            } else if (parts.length > 0) {
                // It's a directory entry
                const dirName = parts[parts.length - 1];
                if (!current.children[dirName]) {
                    current.children[dirName] = {
                        name: dirName,
                        children: {},
                        files: [],
                        isDir: true
                    };
                }
            }
        }
        
        return tree;
    }

    renderTree(node, prefix = '', isLast = true) {
        let output = '';
        
        // Skip rendering the root node itself
        if (node.name !== '/') {
            const connector = isLast ? '└── ' : '├── ';
            const icon = node.isDir ? '📁 ' : '📄 ';
            
            if (node.isDir) {
                output += prefix + connector + this.colorize(icon + node.name + '/', '34') + '\n';
            } else {
                const size = node.size ? ` (${this.formatFileSize(node.size)})` : '';
                output += prefix + connector + icon + node.name + this.colorize(size, '90') + '\n';
            }
        }
        
        const newPrefix = node.name === '/' ? '' : prefix + (isLast ? '    ' : '│   ');
        
        // Render child directories
        const childDirs = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name));
        for (let i = 0; i < childDirs.length; i++) {
            output += this.renderTree(childDirs[i], newPrefix, i === childDirs.length - 1 && node.files.length === 0);
        }
        
        // Render files
        const sortedFiles = node.files.sort((a, b) => a.name.localeCompare(b.name));
        for (let i = 0; i < sortedFiles.length; i++) {
            const file = sortedFiles[i];
            const isLastItem = i === sortedFiles.length - 1;
            output += this.renderTree(file, newPrefix, isLastItem);
        }
        
        return output;
    }

    renderUnavailable(filename) {
        let output = this.colorize('Archive viewer not available', '33') + '\n\n';
        output += 'Archive files cannot be displayed directly in the terminal.\n';
        output += 'To view archive contents, you would need to:\n';
        output += '  1. Extract the archive using appropriate tools\n';
        output += '  2. Use a dedicated archive viewer\n\n';
        output += `Archive: ${filename}\n`;
        
        // Show basic file info if we can determine it
        if (filename.endsWith('.zip')) {
            output += 'Type: ZIP Archive\n';
        } else if (filename.endsWith('.tar')) {
            output += 'Type: TAR Archive\n';
        } else if (filename.endsWith('.tar.gz') || filename.endsWith('.tgz')) {
            output += 'Type: Compressed TAR Archive (gzip)\n';
        } else if (filename.endsWith('.jar')) {
            output += 'Type: Java Archive (JAR)\n';
        }
        
        return output;
    }

    renderLargeFileWarning(size, filename) {
        return this.colorize('⚠ Archive too large for rendering', '33') + '\n' +
               `File: ${filename}\n` +
               `Size: ${this.formatFileSize(size)}\n` +
               `Limit: ${this.formatFileSize(10 * 1024 * 1024)}\n\n` +
               this.colorize('Use a dedicated archive tool for large files.', '90');
    }
}