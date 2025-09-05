export class CatCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    async execute(args) {
        if (args.length === 0) {
            return 'cat: missing file operand\r\n';
        }
        
        const results = [];
        
        for (const file of args) {
            const path = this.terminal.fs.resolvePath(this.terminal.currentPath, file);
            
            if (!this.terminal.fs.exists(path)) {
                results.push(`cat: ${file}: No such file or directory`);
                continue;
            }
            
            if (this.terminal.fs.isDirectory(path)) {
                results.push(`cat: ${file}: Is a directory`);
                continue;
            }
            
            const content = await this.terminal.fs.getContent(path);
            if (content) {
                results.push(this.renderMarkdown(content));
            }
        }
        
        return results.join('\r\n') + '\r\n';
    }


    renderMarkdown(content) {
        // Simple markdown to terminal rendering with proper line wrapping
        let rendered = content;
        
        // Headers
        rendered = rendered.replace(/^### (.*)/gm, '\x1b[33m### $1\x1b[0m');
        rendered = rendered.replace(/^## (.*)/gm, '\x1b[32m## $1\x1b[0m');
        rendered = rendered.replace(/^# (.*)/gm, '\x1b[36m# $1\x1b[0m');
        
        // Bold
        rendered = rendered.replace(/\*\*(.*?)\*\*/g, '\x1b[1m$1\x1b[0m');
        
        // Italic (shown as dim)
        rendered = rendered.replace(/\*(.*?)\*/g, '\x1b[2m$1\x1b[0m');
        
        // Code blocks
        rendered = rendered.replace(/```([\s\S]*?)```/g, (match, code) => {
            return '\x1b[90m' + code.split('\n').map(line => '  ' + line).join('\n') + '\x1b[0m';
        });
        
        // Inline code
        rendered = rendered.replace(/`([^`]+)`/g, '\x1b[93m$1\x1b[0m');
        
        // Links (show URL in parentheses)
        rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 (\x1b[34m$2\x1b[0m)');
        
        // Lists
        rendered = rendered.replace(/^- (.*)/gm, '  • $1');
        rendered = rendered.replace(/^\d+\. (.*)/gm, '  $&');
        
        // Horizontal rules
        rendered = rendered.replace(/^---$/gm, '─'.repeat(60));
        
        // Now apply proper line wrapping and formatting
        return this.formatForTerminal(rendered);
    }

    formatForTerminal(text) {
        const lines = text.split('\n');
        const formattedLines = [];
        const maxWidth = 80; // Terminal width
        
        for (let line of lines) {
            // Skip empty lines (preserve spacing)
            if (line.trim() === '') {
                formattedLines.push('');
                continue;
            }
            
            // Don't wrap headers, lists, or code
            if (line.match(/^(\x1b\[\d+m)?(#{1,3}|•|-|\d+\.|  )/)) {
                formattedLines.push(line);
                continue;
            }
            
            // Wrap long paragraphs
            if (line.length > maxWidth) {
                const wrapped = this.wrapText(line, maxWidth);
                formattedLines.push(...wrapped);
            } else {
                formattedLines.push(line);
            }
        }
        
        // Add proper spacing between sections
        const result = [];
        for (let i = 0; i < formattedLines.length; i++) {
            const current = formattedLines[i];
            const next = formattedLines[i + 1];
            
            result.push(current);
            
            // Add extra line after headers
            if (current.match(/^(\x1b\[\d+m)?#{1,3}/) && next && next.trim() !== '') {
                result.push('');
            }
        }
        
        return result.join('\n');
    }

    wrapText(text, width) {
        // Handle ANSI escape codes properly
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        let currentLength = 0;
        
        for (const word of words) {
            // Calculate actual display length (ignoring ANSI codes)
            const wordDisplayLength = word.replace(/\x1b\[[0-9;]*m/g, '').length;
            
            // If adding this word would exceed width, start new line
            if (currentLength + wordDisplayLength + 1 > width && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
                currentLength = wordDisplayLength;
            } else {
                // Add word to current line
                if (currentLine === '') {
                    currentLine = word;
                    currentLength = wordDisplayLength;
                } else {
                    currentLine += ' ' + word;
                    currentLength += wordDisplayLength + 1;
                }
            }
        }
        
        // Add the last line
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        
        return lines;
    }

    getHelp() {
        const lines = [];
        lines.push('cat - concatenate and display files');
        lines.push('Usage: cat FILE [FILE...]');
        lines.push('');
        lines.push('Description:');
        lines.push('  Display the contents of one or more files.');
        lines.push('  Markdown files are rendered with basic formatting.');
        lines.push('');
        lines.push('Examples:');
        lines.push('  cat README.md          Display README file');
        lines.push('  cat /about            Display about file');
        lines.push('  cat file1 file2       Display multiple files');
        return lines.join('\r\n');
    }
}