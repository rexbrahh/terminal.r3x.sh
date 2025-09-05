import { BaseRenderer } from '../BaseRenderer.js';

/**
 * CSV/TSV renderer using PapaParse library
 * Renders tabular data in a terminal-friendly format
 */
export class CSVRenderer extends BaseRenderer {
    constructor(options = {}) {
        super({
            ...options,
            maxColumns: options.maxColumns || 10,
            maxRows: options.maxRows || 100,
            truncateLength: options.truncateLength || 20
        });
    }

    canRender(fileType) {
        return fileType === 'csv' || fileType === 'tsv';
    }

    getPriority() {
        return 10;
    }

    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('CSVRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename);
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            const fileType = filename.endsWith('.tsv') ? 'TSV' : 'CSV';
            output += this.generateMetadataDisplay(metadata, filename, `${fileType} Data`);
        }

        // Check if PapaParse is available
        if (typeof Papa === 'undefined') {
            return output + this.renderFallback(content, filename);
        }

        try {
            // Detect delimiter
            const delimiter = this.detectDelimiter(content, filename);
            
            // Parse CSV/TSV
            const result = Papa.parse(content, {
                delimiter: delimiter,
                header: false,
                skipEmptyLines: true,
                comments: '#'
            });

            if (result.errors.length > 0 && result.data.length === 0) {
                throw new Error(`Parsing failed: ${result.errors[0].message}`);
            }

            // Render the data
            output += this.renderData(result.data, result.meta);

            // Add parsing warnings if any
            if (result.errors.length > 0) {
                output += '\n' + this.colorize('⚠ Parsing warnings:', '33') + '\n';
                for (const error of result.errors.slice(0, 5)) {
                    output += `  - Row ${error.row || '?'}: ${error.message}\n`;
                }
                if (result.errors.length > 5) {
                    output += `  ... and ${result.errors.length - 5} more\n`;
                }
            }

        } catch (error) {
            console.error('CSV parsing error:', error);
            output += this.colorize(`Error: ${error.message}`, '31') + '\n\n';
            output += this.renderFallback(content, filename);
        }

        return output;
    }

    detectDelimiter(content, filename) {
        // Check file extension first
        if (filename.endsWith('.tsv')) {
            return '\t';
        }
        if (filename.endsWith('.csv')) {
            return ',';
        }

        // Auto-detect delimiter
        const firstLine = content.split('\n')[0] || '';
        const delimiters = [',', '\t', ';', '|'];
        let maxCount = 0;
        let bestDelimiter = ',';

        for (const delim of delimiters) {
            const count = (firstLine.match(new RegExp('\\' + delim, 'g')) || []).length;
            if (count > maxCount) {
                maxCount = count;
                bestDelimiter = delim;
            }
        }

        return bestDelimiter;
    }

    renderData(data, meta = {}) {
        if (!data || data.length === 0) {
            return this.colorize('(Empty dataset)', '90') + '\n';
        }

        // Limit data for display
        const displayRows = data.slice(0, this.options.maxRows);
        const hasMoreRows = data.length > this.options.maxRows;

        // Determine if first row is header
        const hasHeader = this.detectHeader(data);
        const headers = hasHeader ? data[0] : null;
        const rows = hasHeader ? displayRows.slice(1) : displayRows;

        // Limit columns if too many
        let displayCols = [];
        let hasMoreCols = false;
        if (displayRows[0] && displayRows[0].length > this.options.maxColumns) {
            displayCols = Array.from({ length: this.options.maxColumns }, (_, i) => i);
            hasMoreCols = true;
        } else if (displayRows[0]) {
            displayCols = Array.from({ length: displayRows[0].length }, (_, i) => i);
        }

        // Calculate column widths
        const colWidths = this.calculateColumnWidths(displayRows, displayCols);

        let output = '';

        // Add data summary
        output += this.colorize(`Dataset: ${data.length} rows × ${data[0]?.length || 0} columns`, '36') + '\n';
        if (hasMoreRows || hasMoreCols) {
            output += this.colorize(`Showing: ${displayRows.length} rows × ${displayCols.length} columns`, '90') + '\n';
        }
        output += '\n';

        // Render table
        output += this.renderTable(headers, rows, displayCols, colWidths, hasHeader);

        // Add truncation notice
        if (hasMoreRows) {
            output += '\n' + this.colorize(`... ${data.length - this.options.maxRows} more rows`, '90');
        }
        if (hasMoreCols) {
            output += '\n' + this.colorize(`... ${data[0].length - this.options.maxColumns} more columns`, '90');
        }

        return output;
    }

    detectHeader(data) {
        if (data.length < 2) return false;

        const firstRow = data[0];
        const secondRow = data[1];

        // Check if first row has different data types than second row
        for (let i = 0; i < Math.min(firstRow.length, secondRow.length); i++) {
            const firstIsNum = !isNaN(parseFloat(firstRow[i]));
            const secondIsNum = !isNaN(parseFloat(secondRow[i]));
            
            // If first row has text and second has numbers, likely a header
            if (!firstIsNum && secondIsNum) {
                return true;
            }
        }

        // Check if first row values look like headers (common patterns)
        const headerPatterns = /^(id|name|date|time|value|count|total|price|amount|type|status|category)/i;
        for (const cell of firstRow) {
            if (headerPatterns.test(cell)) {
                return true;
            }
        }

        return false;
    }

    calculateColumnWidths(rows, colIndices) {
        const widths = [];
        
        for (const colIdx of colIndices) {
            let maxWidth = 0;
            for (const row of rows) {
                const cell = row[colIdx] || '';
                const truncated = this.truncateCell(cell);
                maxWidth = Math.max(maxWidth, truncated.length);
            }
            widths.push(Math.min(maxWidth, this.options.truncateLength));
        }
        
        return widths;
    }

    renderTable(headers, rows, colIndices, colWidths, hasHeader) {
        let output = '';

        // Top border
        output += '┌' + colIndices.map((_, i) => '─'.repeat(colWidths[i] + 2)).join('┬') + '┐\n';

        // Headers
        if (hasHeader && headers) {
            output += '│';
            for (let i = 0; i < colIndices.length; i++) {
                const colIdx = colIndices[i];
                const header = this.truncateCell(headers[colIdx] || '');
                const padding = colWidths[i] - header.length;
                output += ' ' + this.colorize(header, '1') + ' '.repeat(padding) + ' │';
            }
            output += '\n';
            
            // Header separator
            output += '├' + colIndices.map((_, i) => '─'.repeat(colWidths[i] + 2)).join('┼') + '┤\n';
        }

        // Data rows
        for (const row of rows) {
            output += '│';
            for (let i = 0; i < colIndices.length; i++) {
                const colIdx = colIndices[i];
                const cell = this.truncateCell(row[colIdx] || '');
                const padding = colWidths[i] - cell.length;
                
                // Color numbers differently
                const isNumber = !isNaN(parseFloat(cell));
                const displayCell = isNumber ? this.colorize(cell, '33') : cell;
                
                output += ' ' + displayCell + ' '.repeat(padding) + ' │';
            }
            output += '\n';
        }

        // Bottom border
        output += '└' + colIndices.map((_, i) => '─'.repeat(colWidths[i] + 2)).join('┴') + '┘';

        return output;
    }

    truncateCell(cell) {
        const str = String(cell).trim();
        if (str.length > this.options.truncateLength) {
            return str.substring(0, this.options.truncateLength - 3) + '...';
        }
        return str;
    }

    renderFallback(content, filename) {
        // Basic fallback rendering without PapaParse
        const lines = content.split('\n').slice(0, 20);
        let output = this.colorize('Raw data (first 20 lines):', '90') + '\n';
        output += this.colorize('─'.repeat(this.options.maxWidth), '90') + '\n';
        
        for (const line of lines) {
            if (line.length > this.options.maxWidth) {
                output += line.substring(0, this.options.maxWidth - 3) + '...\n';
            } else {
                output += line + '\n';
            }
        }
        
        if (content.split('\n').length > 20) {
            output += this.colorize(`... ${content.split('\n').length - 20} more lines`, '90') + '\n';
        }
        
        return output;
    }

    renderLargeFileWarning(size, filename) {
        return this.colorize('⚠ File too large for rendering', '33') + '\n' +
               `File: ${filename}\n` +
               `Size: ${this.formatFileSize(size)}\n` +
               `Limit: ${this.formatFileSize(1024 * 1024)}\n\n` +
               this.colorize('Consider using a dedicated spreadsheet application.', '90');
    }
}