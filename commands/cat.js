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
            
            // Check if this is a dynamic content path
            const content = await this.getDynamicContent(path) || this.terminal.fs.getContent(path);
            if (content) {
                results.push(this.renderMarkdown(content));
            }
        }
        
        return results.join('\r\n') + '\r\n';
    }

    async getDynamicContent(path) {
        // Check if path matches dynamic content patterns
        if (path === '/about.md') {
            const page = await this.terminal.api.getPage('about');
            return page ? page.content : null;
        }
        
        // Check for blog posts in /blogs/ directory
        if (path.startsWith('/blogs/') && path.endsWith('.md')) {
            const slug = path.replace('/blogs/', '').replace('.md', '');
            const post = await this.terminal.api.getPost(slug);
            return post ? `# ${post.title}\n\n${post.content}` : null;
        }

        // Check for pages in /home, /now directories
        if (path === '/home/index.md') {
            const page = await this.terminal.api.getPage('home');
            return page ? page.content : null;
        }

        if (path === '/now/index.md') {
            const page = await this.terminal.api.getPage('now');
            return page ? page.content : null;
        }
        
        return null;
    }

    renderMarkdown(content) {
        // Simple markdown to terminal rendering
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
        
        return rendered;
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