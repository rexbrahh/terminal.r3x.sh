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
        return `ls - list directory contents
Usage: ls [OPTIONS] [PATH]

Options:
  -l    use a long listing format
  -a    show hidden files (starting with .)
  -la   combine -l and -a options

Examples:
  ls          List current directory
  ls /blog    List contents of /blog
  ls -la      Detailed listing with hidden files`;
    }
}