export class CatCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
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
            
            const content = this.terminal.fs.getContent(path);
            if (content) {
                results.push(this.renderMarkdown(content));
            }
        }
        
        return results.join('\r\n') + '\r\n';
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
        return `cat - concatenate and display files
Usage: cat FILE [FILE...]

Description:
  Display the contents of one or more files.
  Markdown files are rendered with basic formatting.

Examples:
  cat README.md          Display README file
  cat /about            Display about file
  cat file1 file2       Display multiple files`;
    }
}