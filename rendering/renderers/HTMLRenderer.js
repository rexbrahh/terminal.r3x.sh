import { BaseRenderer } from '../BaseRenderer.js';

/**
 * HTML renderer that converts HTML to terminal-friendly text
 * Uses DOMPurify for sanitization and custom parsing for terminal output
 */
export class HTMLRenderer extends BaseRenderer {
    constructor(options = {}) {
        super({
            ...options,
            showLinks: options.showLinks !== false,
            showImages: options.showImages !== false,
            preserveStructure: options.preserveStructure !== false
        });
    }

    canRender(fileType) {
        return fileType === 'html' || fileType === 'htm' || fileType === 'xhtml';
    }

    getPriority() {
        return 10;
    }

    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('HTMLRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename);
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateMetadataDisplay(metadata, filename, 'HTML Document');
        }

        // Sanitize HTML if DOMPurify is available
        let cleanHtml = content;
        if (typeof DOMPurify !== 'undefined') {
            cleanHtml = DOMPurify.sanitize(content, {
                WHOLE_DOCUMENT: true,
                RETURN_DOM: false
            });
        } else {
            // Basic sanitization if DOMPurify not available
            cleanHtml = this.basicSanitize(content);
        }

        // Convert HTML to terminal text
        const terminalText = this.htmlToTerminal(cleanHtml);
        output += terminalText;

        return output;
    }

    htmlToTerminal(html) {
        // Create a virtual DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract metadata
        const title = doc.querySelector('title')?.textContent;
        const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content');
        
        let output = '';
        
        // Show title if present
        if (title) {
            output += this.colorize('═'.repeat(this.options.maxWidth), '36') + '\n';
            output += this.colorize(this.centerText(title, this.options.maxWidth), '36') + '\n';
            output += this.colorize('═'.repeat(this.options.maxWidth), '36') + '\n\n';
        }
        
        // Show description if present
        if (metaDescription) {
            output += this.colorize('Description: ', '90') + metaDescription + '\n\n';
        }

        // Process body content
        const body = doc.body || doc.documentElement;
        if (body) {
            output += this.processNode(body, 0);
        } else {
            // Fallback to basic text extraction
            output += this.extractText(html);
        }

        return output;
    }

    processNode(node, depth = 0) {
        let output = '';
        
        // Skip script and style elements
        if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
            return '';
        }

        // Handle text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                return text + ' ';
            }
            return '';
        }

        // Handle element nodes
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.nodeName.toLowerCase();
            
            // Block-level elements
            switch (tagName) {
                case 'h1':
                    output += '\n' + this.colorize('# ' + this.getTextContent(node), '36') + '\n\n';
                    return output;
                    
                case 'h2':
                    output += '\n' + this.colorize('## ' + this.getTextContent(node), '32') + '\n\n';
                    return output;
                    
                case 'h3':
                    output += '\n' + this.colorize('### ' + this.getTextContent(node), '33') + '\n\n';
                    return output;
                    
                case 'h4':
                case 'h5':
                case 'h6':
                    output += '\n' + this.colorize('#### ' + this.getTextContent(node), '35') + '\n\n';
                    return output;
                    
                case 'p':
                    const pText = this.processChildren(node, depth);
                    if (pText.trim()) {
                        output += this.wrapText(pText, this.options.maxWidth).join('\n') + '\n\n';
                    }
                    return output;
                    
                case 'div':
                case 'section':
                case 'article':
                case 'main':
                case 'aside':
                    output += this.processChildren(node, depth);
                    if (output && !output.endsWith('\n\n')) {
                        output += '\n';
                    }
                    return output;
                    
                case 'ul':
                case 'ol':
                    output += this.processList(node, tagName === 'ol', depth) + '\n';
                    return output;
                    
                case 'li':
                    // Handled by processList
                    return '';
                    
                case 'blockquote':
                    const quoteText = this.processChildren(node, depth);
                    if (quoteText.trim()) {
                        const lines = quoteText.trim().split('\n');
                        output += lines.map(line => this.colorize('│ ', '90') + this.colorize(line, '37')).join('\n') + '\n\n';
                    }
                    return output;
                    
                case 'pre':
                    const codeElement = node.querySelector('code');
                    const code = codeElement ? codeElement.textContent : node.textContent;
                    const lang = codeElement?.className?.match(/language-(\w+)/)?.[1] || '';
                    output += this.renderCodeBlock(code, lang) + '\n';
                    return output;
                    
                case 'code':
                    if (node.parentNode?.nodeName !== 'PRE') {
                        output += this.colorize(node.textContent, '93');
                    }
                    return output;
                    
                case 'a':
                    const href = node.getAttribute('href');
                    const linkText = this.getTextContent(node);
                    if (this.options.showLinks && href) {
                        output += linkText + ' ' + this.colorize(`(${href})`, '34');
                    } else {
                        output += linkText;
                    }
                    return output;
                    
                case 'img':
                    if (this.options.showImages) {
                        const alt = node.getAttribute('alt') || 'image';
                        const src = node.getAttribute('src');
                        output += this.colorize(`[Image: ${alt}]`, '35');
                        if (src) {
                            output += ' ' + this.colorize(`(${src})`, '34');
                        }
                    }
                    return output;
                    
                case 'table':
                    output += this.processTable(node) + '\n';
                    return output;
                    
                case 'hr':
                    output += this.colorize('─'.repeat(this.options.maxWidth), '90') + '\n\n';
                    return output;
                    
                case 'br':
                    output += '\n';
                    return output;
                    
                case 'strong':
                case 'b':
                    output += this.colorize(this.getTextContent(node), '1');
                    return output;
                    
                case 'em':
                case 'i':
                    output += this.colorize(this.getTextContent(node), '3');
                    return output;
                    
                case 'del':
                case 's':
                case 'strike':
                    output += this.colorize(this.getTextContent(node), '9');
                    return output;
                    
                default:
                    // Process children for unknown elements
                    output += this.processChildren(node, depth);
            }
        }

        // Process children for other node types
        output += this.processChildren(node, depth);
        
        return output;
    }

    processChildren(node, depth) {
        let output = '';
        for (const child of node.childNodes) {
            output += this.processNode(child, depth + 1);
        }
        return output;
    }

    getTextContent(node) {
        return node.textContent?.trim() || '';
    }

    processList(listNode, ordered, depth) {
        let output = '';
        const items = listNode.querySelectorAll(':scope > li');
        const indent = '  '.repeat(depth);
        
        items.forEach((item, index) => {
            const marker = ordered ? `${index + 1}. ` : '• ';
            const text = this.processChildren(item, depth + 1);
            if (text.trim()) {
                output += indent + marker + text.trim() + '\n';
            }
        });
        
        return output;
    }

    processTable(tableNode) {
        const rows = [];
        const allRows = tableNode.querySelectorAll('tr');
        
        // Extract data
        allRows.forEach(tr => {
            const cells = [];
            tr.querySelectorAll('td, th').forEach(cell => {
                cells.push(this.getTextContent(cell));
            });
            if (cells.length > 0) {
                rows.push(cells);
            }
        });
        
        if (rows.length === 0) return '';
        
        // Calculate column widths
        const colWidths = [];
        rows.forEach(row => {
            row.forEach((cell, i) => {
                colWidths[i] = Math.max(colWidths[i] || 0, cell.length);
            });
        });
        
        let output = '';
        
        // Top border
        output += '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐\n';
        
        // Rows
        rows.forEach((row, rowIndex) => {
            output += '│';
            row.forEach((cell, colIndex) => {
                const padding = colWidths[colIndex] - cell.length;
                output += ' ' + cell + ' '.repeat(padding) + ' │';
            });
            output += '\n';
            
            // Add separator after header row (first row)
            if (rowIndex === 0 && rows.length > 1) {
                output += '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤\n';
            }
        });
        
        // Bottom border
        output += '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';
        
        return output;
    }

    renderCodeBlock(code, language = '') {
        const lines = code.split('\n');
        let output = '';
        
        // Header with language
        if (language) {
            output += this.colorize(`┌─ ${language} `, '90') + 
                     this.colorize('─'.repeat(Math.max(0, this.options.maxWidth - language.length - 4)), '90') + '\n';
        } else {
            output += this.colorize('┌' + '─'.repeat(this.options.maxWidth - 1), '90') + '\n';
        }
        
        // Code lines
        for (const line of lines) {
            output += this.colorize('│ ', '90') + line + '\n';
        }
        
        // Footer
        output += this.colorize('└' + '─'.repeat(this.options.maxWidth - 1), '90');
        
        return output;
    }

    centerText(text, width) {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
    }

    basicSanitize(html) {
        // Remove script and style tags
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        
        // Remove on* attributes
        html = html.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
        html = html.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
        
        // Remove javascript: protocol
        html = html.replace(/javascript:/gi, '');
        
        return html;
    }

    extractText(html) {
        // Fallback text extraction
        let text = html;
        
        // Remove tags
        text = text.replace(/<[^>]+>/g, ' ');
        
        // Decode HTML entities
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&#39;/g, "'");
        text = text.replace(/&nbsp;/g, ' ');
        
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    }

    renderLargeFileWarning(size, filename) {
        return this.colorize('⚠ HTML file too large for rendering', '33') + '\n' +
               `File: ${filename}\n` +
               `Size: ${this.formatFileSize(size)}\n` +
               `Limit: ${this.formatFileSize(1024 * 1024)}\n\n` +
               this.colorize('Consider using a web browser for large HTML files.', '90');
    }
}