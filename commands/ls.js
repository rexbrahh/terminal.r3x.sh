export class LsCommand {
    constructor(terminal, options = {}) {
        this.terminal = terminal;
        this.detailed = options.detailed || false;
    }

    execute(args) {
        const detailed = this.detailed || args.includes('-l') || args.includes('-la');
        const showHidden = args.includes('-a') || args.includes('-la');
        
        const targetPath = args.find(arg => !arg.startsWith('-')) || this.terminal.currentPath;
        const resolvedPath = this.terminal.fs.resolvePath(this.terminal.currentPath, targetPath);
        
        if (!this.terminal.fs.exists(resolvedPath)) {
            return `ls: cannot access '${targetPath}': No such file or directory\r\n`;
        }
        
        if (!this.terminal.fs.isDirectory(resolvedPath)) {
            return `ls: ${targetPath}: Not a directory\r\n`;
        }
        
        let children = this.terminal.fs.getChildren(resolvedPath);
        
        if (!showHidden) {
            children = children.filter(child => !child.startsWith('.'));
        }
        
        if (children.length === 0) {
            return '';
        }
        
        const listing = this.terminal.fs.formatListing(resolvedPath, detailed);
        return listing + '\r\n';
    }

    getHelp() {
        const lines = [];
        lines.push('ls - list directory contents');
        lines.push('Usage: ls [OPTIONS] [PATH]');
        lines.push('');
        lines.push('Options:');
        lines.push('  -l    use a long listing format');
        lines.push('  -a    show hidden files (starting with .)');
        lines.push('  -la   combine -l and -a options');
        lines.push('');
        lines.push('Examples:');
        lines.push('  ls          List current directory');
        lines.push('  ls /blog    List contents of /blog');
        lines.push('  ls -la      Detailed listing with hidden files');
        return lines.join('\r\n');
    }
}