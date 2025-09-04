export class StartCommand {
    constructor(terminal) {
        this.terminal = terminal;
    }

    execute(args) {
        if (args.length === 0) {
            return 'start: missing URL operand\r\nUsage: start <URL>\r\n';
        }
        
        let url = args[0];
        
        // Auto-prefix with https:// if no protocol is provided
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // Basic URL validation
        if (!this.isValidUrl(url)) {
            return `start: '${args[0]}' is not a valid URL\r\nPlease provide a valid URL (e.g., example.com or https://example.com)\r\n`;
        }
        
        // Redirect to the URL
        try {
            window.open(url, '_blank');
            return `Opening ${url} in new tab...\r\n`;
        } catch (error) {
            return `start: failed to open ${url}\r\n`;
        }
    }
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    getHelp() {
        const lines = [];
        lines.push('start - open URL in new browser tab');
        lines.push('Usage: start <URL>');
        lines.push('');
        lines.push('Description:');
        lines.push('  Opens the specified URL in a new browser tab.');
        lines.push('  Automatically prefixes with https:// if no protocol is specified.');
        lines.push('');
        lines.push('Examples:');
        lines.push('  start https://r3x.sh        Open r3x.sh in new tab');
        lines.push('  start r3x.sh                Auto-prefix with https://');
        lines.push('  start github.com             Open https://github.com');
        lines.push('  start google.com             Open https://google.com');
        return lines.join('\r\n');
    }
}