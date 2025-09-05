/**
 * Terminal styling utility using chalk for proper ANSI code generation
 * Replaces manual escape code handling with battle-tested library
 */
export class TerminalStyler {
    constructor() {
        // Try to use chalk if available, otherwise fallback to manual codes
        this.chalk = typeof chalk !== 'undefined' ? chalk : null;
        this.stringWidth = typeof stringWidth !== 'undefined' ? stringWidth : null;
        
        // Color mappings for fallback
        this.colors = {
            black: '30',
            red: '31', 
            green: '32',
            yellow: '33',
            blue: '34',
            magenta: '35',
            cyan: '36',
            white: '37',
            gray: '90',
            brightRed: '91',
            brightGreen: '92',
            brightYellow: '93',
            brightBlue: '94',
            brightMagenta: '95',
            brightCyan: '96',
            brightWhite: '97'
        };
        
        this.styles = {
            bold: '1',
            dim: '2',
            italic: '3',
            underline: '4',
            strikethrough: '9'
        };
    }
    
    /**
     * Apply color to text using chalk or fallback to ANSI codes
     * @param {string} text - Text to colorize
     * @param {string} color - Color name
     * @returns {string} Colored text
     */
    color(text, color) {
        if (this.chalk) {
            // Use chalk for proper color handling
            switch (color) {
                case 'red': return this.chalk.red(text);
                case 'green': return this.chalk.green(text);
                case 'yellow': return this.chalk.yellow(text);
                case 'blue': return this.chalk.blue(text);
                case 'magenta': return this.chalk.magenta(text);
                case 'cyan': return this.chalk.cyan(text);
                case 'white': return this.chalk.white(text);
                case 'gray': return this.chalk.gray(text);
                case 'brightRed': return this.chalk.redBright(text);
                case 'brightGreen': return this.chalk.greenBright(text);
                case 'brightYellow': return this.chalk.yellowBright(text);
                case 'brightBlue': return this.chalk.blueBright(text);
                case 'brightMagenta': return this.chalk.magentaBright(text);
                case 'brightCyan': return this.chalk.cyanBright(text);
                default: return text;
            }
        } else {
            // Fallback to manual ANSI codes
            const colorCode = this.colors[color];
            return colorCode ? `\x1b[${colorCode}m${text}\x1b[0m` : text;
        }
    }
    
    /**
     * Apply style to text
     * @param {string} text - Text to style
     * @param {string} style - Style name
     * @returns {string} Styled text
     */
    style(text, style) {
        if (this.chalk) {
            switch (style) {
                case 'bold': return this.chalk.bold(text);
                case 'dim': return this.chalk.dim(text);
                case 'italic': return this.chalk.italic(text);
                case 'underline': return this.chalk.underline(text);
                case 'strikethrough': return this.chalk.strikethrough(text);
                default: return text;
            }
        } else {
            const styleCode = this.styles[style];
            return styleCode ? `\x1b[${styleCode}m${text}\x1b[0m` : text;
        }
    }
    
    /**
     * Combine color and style
     * @param {string} text - Text to style
     * @param {string} color - Color name
     * @param {string} style - Style name
     * @returns {string} Styled and colored text
     */
    colorStyle(text, color, style) {
        if (this.chalk) {
            let result = text;
            if (color) result = this.color(result, color);
            if (style) result = this.style(result, style);
            return result;
        } else {
            const colorCode = this.colors[color];
            const styleCode = this.styles[style];
            let codes = [];
            if (styleCode) codes.push(styleCode);
            if (colorCode) codes.push(colorCode);
            return codes.length ? `\x1b[${codes.join(';')}m${text}\x1b[0m` : text;
        }
    }
    
    /**
     * Get the display width of text (excluding ANSI codes)
     * @param {string} text - Text to measure
     * @returns {number} Display width
     */
    getWidth(text) {
        if (this.stringWidth) {
            return this.stringWidth(text);
        } else {
            // Fallback: remove ANSI codes manually and measure
            return text.replace(/\x1b\[[0-9;]*m/g, '').length;
        }
    }
    
    /**
     * Wrap text to specified width accounting for ANSI codes
     * @param {string} text - Text to wrap
     * @param {number} width - Target width
     * @returns {string[]} Array of wrapped lines
     */
    wrapText(text, width) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            
            if (this.getWidth(testLine) <= width) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Word is longer than width, split it
                    const chars = word.split('');
                    let chunk = '';
                    for (const char of chars) {
                        if (this.getWidth(chunk + char) <= width) {
                            chunk += char;
                        } else {
                            if (chunk) lines.push(chunk);
                            chunk = char;
                        }
                    }
                    currentLine = chunk;
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    
    /**
     * Pad text to specified width
     * @param {string} text - Text to pad
     * @param {number} width - Target width
     * @param {string} char - Padding character (default: space)
     * @returns {string} Padded text
     */
    padRight(text, width, char = ' ') {
        const textWidth = this.getWidth(text);
        const padding = Math.max(0, width - textWidth);
        return text + char.repeat(padding);
    }
    
    /**
     * Create a separator line
     * @param {number} width - Width of separator
     * @param {string} char - Character to use (default: ─)
     * @param {string} color - Color for separator
     * @returns {string} Separator line
     */
    separator(width, char = '─', color = 'gray') {
        const line = char.repeat(width);
        return color ? this.color(line, color) : line;
    }
    
    /**
     * Create a bordered box around text
     * @param {string} text - Text to box
     * @param {number} width - Box width
     * @param {string} color - Border color
     * @returns {string} Boxed text
     */
    box(text, width, color = 'gray') {
        const lines = this.wrapText(text, width - 4); // Account for borders
        const topBorder = '┌' + '─'.repeat(width - 2) + '┐';
        const bottomBorder = '└' + '─'.repeat(width - 2) + '┘';
        
        const result = [this.color(topBorder, color)];
        
        for (const line of lines) {
            const paddedLine = this.padRight(line, width - 4);
            const boxedLine = this.color('│ ', color) + paddedLine + this.color(' │', color);
            result.push(boxedLine);
        }
        
        result.push(this.color(bottomBorder, color));
        return result.join('\n');
    }
    
    // Convenience methods for common styling
    success(text) { return this.color(text, 'green'); }
    error(text) { return this.color(text, 'red'); }
    warning(text) { return this.color(text, 'yellow'); }
    info(text) { return this.color(text, 'cyan'); }
    muted(text) { return this.color(text, 'gray'); }
    highlight(text) { return this.colorStyle(text, 'yellow', 'bold'); }
    
    // Header styles
    h1(text) { return this.colorStyle(text, 'cyan', 'bold'); }
    h2(text) { return this.colorStyle(text, 'green', 'bold'); }
    h3(text) { return this.colorStyle(text, 'yellow', 'bold'); }
    
    // Code styling
    code(text) { return this.color(text, 'brightYellow'); }
    keyword(text) { return this.color(text, 'magenta'); }
    string(text) { return this.color(text, 'green'); }
    number(text) { return this.color(text, 'yellow'); }
    comment(text) { return this.color(text, 'gray'); }
}