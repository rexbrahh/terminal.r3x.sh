import { ImprovedBaseRenderer } from '../ImprovedBaseRenderer.js';

/**
 * Improved Markdown renderer using marked with custom terminal-focused renderer
 */
export class ImprovedMarkdownRenderer extends ImprovedBaseRenderer {
    constructor(options = {}) {
        super(options);
        this.setupMarkedRenderer();
    }

    canRender(fileType) {
        return fileType === 'markdown';
    }

    getPriority() {
        return 20; // Higher priority than basic renderer
    }

    setupMarkedRenderer() {
        if (typeof marked === 'undefined') {
            console.warn('marked.js not loaded, falling back to basic renderer');
            return;
        }

        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            tables: true,
            sanitize: false,
            smartLists: true,
            smartypants: false // Disable to avoid quote conversion issues
        });

        // Create custom renderer for terminal output
        this.renderer = new marked.Renderer();
        
        // Headers
        this.renderer.heading = (text, level) => {
            const cleanText = this.stripHtml(text);
            switch (level) {
                case 1: return this.styler.h1('# ' + cleanText) + '\n\n';
                case 2: return this.styler.h2('## ' + cleanText) + '\n\n';
                case 3: return this.styler.h3('### ' + cleanText) + '\n\n';
                default: return this.styler.style('#### ' + cleanText, 'bold') + '\n\n';
            }
        };

        // Paragraphs
        this.renderer.paragraph = (text) => {
            const cleanText = this.stripHtml(text);
            const wrapped = this.styler.wrapText(cleanText, this.options.maxWidth);
            return wrapped.join('\n') + '\n\n';
        };

        // Code blocks
        this.renderer.code = (code, language) => {
            return this.createCodeBlock(code, language) + '\n\n';
        };

        // Inline code
        this.renderer.codespan = (code) => {
            return this.styler.code(code);
        };

        // Links
        this.renderer.link = (href, title, text) => {
            const linkText = this.stripHtml(text);
            return `${linkText} ${this.styler.info('(' + href + ')')}`;
        };

        // Emphasis
        this.renderer.strong = (text) => {
            return this.styler.style(this.stripHtml(text), 'bold');
        };

        this.renderer.em = (text) => {
            return this.styler.style(this.stripHtml(text), 'italic');
        };

        this.renderer.del = (text) => {
            return this.styler.style(this.stripHtml(text), 'strikethrough');
        };

        // Lists
        this.renderer.list = (body, ordered, start) => {
            return body + '\n';
        };

        this.renderer.listitem = (text, task, checked) => {
            const cleanText = this.stripHtml(text).trim();
            
            if (task) {
                const checkbox = checked ? 
                    this.styler.success('[✓]') : 
                    this.styler.muted('[ ]');
                return `  ${checkbox} ${cleanText}\n`;
            }
            
            return `  ${this.styler.info('•')} ${cleanText}\n`;
        };

        // Blockquotes
        this.renderer.blockquote = (quote) => {
            const lines = this.stripHtml(quote).split('\n').filter(line => line.trim());
            const quotedLines = lines.map(line => 
                this.styler.muted('│ ') + this.styler.style(line, 'italic')
            );
            return quotedLines.join('\n') + '\n\n';
        };

        // Horizontal rule
        this.renderer.hr = () => {
            return this.styler.separator(this.options.maxWidth, '─', 'gray') + '\n\n';
        };

        // Tables
        this.renderer.table = (header, body) => {
            const headerRows = this.parseTableRows(header);
            const bodyRows = this.parseTableRows(body);
            const allRows = [...headerRows, ...bodyRows];
            
            if (allRows.length === 0) return '';
            
            return this.createManualTable(allRows, { 
                headers: headerRows.length > 0,
                headerColor: 'cyan' 
            }) + '\n\n';
        };

        // Images
        this.renderer.image = (href, title, text) => {
            const altText = text || title || 'untitled';
            return this.styler.color(`[Image: ${altText}]`, 'magenta') + ' ' + 
                   this.styler.info('(' + href + ')');
        };

        // HTML fallback
        this.renderer.html = (html) => {
            return this.styler.muted('[HTML content]') + '\n';
        };
    }

    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('ImprovedMarkdownRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename,
                'Consider using a dedicated Markdown viewer for large files.');
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            output += this.generateMetadataDisplay(metadata, filename, 'Markdown Document');
        }

        try {
            if (typeof marked !== 'undefined' && this.renderer) {
                // Use marked with custom renderer
                const rendered = marked.parse(content, { renderer: this.renderer });
                output += this.cleanupOutput(rendered);
            } else {
                // Fallback to basic markdown rendering
                output += this.basicMarkdownRender(content);
            }
        } catch (error) {
            console.error('Markdown parsing error:', error);
            output += this.renderError(error, filename);
            output += '\n\n' + this.basicMarkdownRender(content);
        }

        return output;
    }

    /**
     * Parse table HTML rows
     * @param {string} html 
     * @returns {string[][]}
     */
    parseTableRows(html) {
        if (!html) return [];
        
        const rows = [];
        
        // Simple regex-based HTML parsing for table rows
        const rowMatches = html.match(/<tr[^>]*>(.*?)<\/tr>/gs) || [];
        
        for (const rowHtml of rowMatches) {
            const cells = [];
            const cellMatches = rowHtml.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gs) || [];
            
            for (const cellHtml of cellMatches) {
                const cellContent = cellHtml.replace(/<[^>]*>/g, '').trim();
                cells.push(cellContent);
            }
            
            if (cells.length > 0) {
                rows.push(cells);
            }
        }
        
        return rows;
    }

    /**
     * Strip HTML tags from text
     * @param {string} html 
     * @returns {string}
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').trim();
    }

    /**
     * Clean up markdown output
     * @param {string} output 
     * @returns {string}
     */
    cleanupOutput(output) {
        // Remove excessive newlines but preserve paragraph breaks
        output = output.replace(/\n{3,}/g, '\n\n');
        
        // Remove trailing whitespace from lines
        output = output.replace(/[ \t]+$/gm, '');
        
        // Ensure single newline at end
        output = output.trimEnd() + '\n';
        
        return output;
    }

    /**
     * Basic markdown rendering fallback
     * @param {string} content 
     * @returns {string}
     */
    basicMarkdownRender(content) {
        let output = content;
        
        // Headers
        output = output.replace(/^### (.*)/gm, (match, text) => 
            this.styler.h3('### ' + text));
        output = output.replace(/^## (.*)/gm, (match, text) => 
            this.styler.h2('## ' + text));
        output = output.replace(/^# (.*)/gm, (match, text) => 
            this.styler.h1('# ' + text));
        
        // Bold and italic
        output = output.replace(/\*\*(.*?)\*\*/g, (match, text) => 
            this.styler.style(text, 'bold'));
        output = output.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, (match, text) => 
            this.styler.style(text, 'italic'));
        
        // Inline code
        output = output.replace(/`([^`\n]+?)`/g, (match, code) => 
            this.styler.code(code));
        
        // Links
        output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => 
            `${text} ${this.styler.info('(' + url + ')')}`);
        
        // Lists
        output = output.replace(/^[\s]*[-*+]\s+(.*)/gm, (match, text) => 
            `  ${this.styler.info('•')} ${text}`);
        
        // Code blocks
        output = output.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, language, code) => 
            this.createCodeBlock(code.trim(), language));
        
        // Horizontal rules
        output = output.replace(/^[-*_]{3,}$/gm, () => 
            this.styler.separator(this.options.maxWidth, '─', 'gray'));
        
        return output;
    }
}