import { ImprovedBaseRenderer } from '../ImprovedBaseRenderer.js';

/**
 * Improved CSV/TSV renderer using cli-table3 for better table formatting
 */
export class ImprovedCSVRenderer extends ImprovedBaseRenderer {
    constructor(options = {}) {
        super({
            ...options,
            maxColumns: options.maxColumns || 8,
            maxRows: options.maxRows || 50,
            cellMaxWidth: options.cellMaxWidth || 20
        });
    }

    canRender(fileType) {
        return fileType === 'csv' || fileType === 'tsv';
    }

    getPriority() {
        return 15; // Higher than basic renderer
    }

    async render(content, filename, metadata = {}) {
        if (typeof content !== 'string') {
            throw new Error('ImprovedCSVRenderer can only handle text content');
        }

        if (this.isContentTooLarge(content)) {
            return this.renderLargeFileWarning(content.length, filename, 
                'Consider using a spreadsheet application for large CSV files.');
        }

        let output = '';

        // Add metadata if requested
        if (this.options.showMetadata) {
            const fileType = filename.endsWith('.tsv') ? 'TSV' : 'CSV';
            output += this.generateMetadataDisplay(metadata, filename, `${fileType} Data`);
        }

        try {
            // Parse CSV/TSV
            const result = this.parseCSV(content, filename);
            
            if (!result.data || result.data.length === 0) {
                return output + this.styler.muted('(Empty dataset)');
            }

            // Render the data
            output += this.renderTableData(result.data, result.hasHeader);

            // Add parsing warnings if any
            if (result.warnings && result.warnings.length > 0) {
                output += '\n\n' + this.styler.warning('⚠ Parsing warnings:');
                result.warnings.slice(0, 3).forEach(warning => {
                    output += '\n  ' + this.styler.muted('• ' + warning);
                });
                if (result.warnings.length > 3) {
                    output += `\n  ${this.styler.muted(`... and ${result.warnings.length - 3} more`)}`;
                }
            }

        } catch (error) {
            console.error('CSV parsing error:', error);
            output += this.renderError(error, filename);
            output += '\n\n' + this.renderPlainTextFallback(content);
        }

        return output;
    }

    /**
     * Parse CSV/TSV content
     * @param {string} content 
     * @param {string} filename 
     * @returns {Object}
     */
    parseCSV(content, filename) {
        // Detect delimiter
        const delimiter = this.detectDelimiter(content, filename);
        
        if (typeof Papa !== 'undefined') {
            // Use PapaParse if available
            const result = Papa.parse(content, {
                delimiter: delimiter,
                header: false,
                skipEmptyLines: true,
                comments: '#',
                transform: (value) => value.trim()
            });
            
            return {
                data: result.data || [],
                hasHeader: this.detectHeader(result.data || []),
                warnings: result.errors?.map(e => `Row ${e.row || '?'}: ${e.message}`) || []
            };
        } else {
            // Fallback manual parsing
            const lines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
                
            const data = lines.map(line => {
                return line.split(delimiter).map(cell => cell.trim());
            });
            
            return {
                data: data,
                hasHeader: this.detectHeader(data),
                warnings: []
            };
        }
    }

    /**
     * Detect CSV delimiter
     * @param {string} content 
     * @param {string} filename 
     * @returns {string}
     */
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

    /**
     * Detect if first row is header
     * @param {string[][]} data 
     * @returns {boolean}
     */
    detectHeader(data) {
        if (data.length < 2) return false;

        const firstRow = data[0];
        const secondRow = data[1];

        // Check if first row has different data types than second row
        for (let i = 0; i < Math.min(firstRow.length, secondRow.length); i++) {
            const firstIsNum = !isNaN(parseFloat(firstRow[i])) && isFinite(firstRow[i]);
            const secondIsNum = !isNaN(parseFloat(secondRow[i])) && isFinite(secondRow[i]);
            
            // If first row has text and second has numbers, likely a header
            if (!firstIsNum && secondIsNum) {
                return true;
            }
        }

        // Check if first row values look like headers
        const headerPatterns = /^(id|name|date|time|value|count|total|price|amount|type|status|category|email|phone|address)/i;
        for (const cell of firstRow) {
            if (headerPatterns.test(cell)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Render table data using cli-table3 or fallback
     * @param {string[][]} data 
     * @param {boolean} hasHeader 
     * @returns {string}
     */
    renderTableData(data, hasHeader) {
        let output = '';
        
        // Limit data for display
        const displayRows = data.slice(0, this.options.maxRows);
        const hasMoreRows = data.length > this.options.maxRows;

        if (displayRows.length === 0) {
            return this.styler.muted('(No data to display)');
        }

        // Limit columns if too many
        const maxCols = displayRows[0]?.length || 0;
        const displayCols = Math.min(maxCols, this.options.maxColumns);
        const hasMoreCols = maxCols > this.options.maxColumns;

        // Prepare data for table
        const tableData = displayRows.map(row => 
            row.slice(0, displayCols).map(cell => 
                this.truncate(String(cell || ''), this.options.cellMaxWidth)
            )
        );

        // Add data summary
        output += this.styler.info(`Dataset: ${data.length} rows × ${maxCols} columns`);
        if (hasMoreRows || hasMoreCols) {
            output += '\n' + this.styler.muted(`Showing: ${displayRows.length} rows × ${displayCols} columns`);
        }
        output += '\n\n';

        // Create table
        if (typeof Table !== 'undefined') {
            // Use cli-table3
            const table = new Table({
                style: { 
                    head: hasHeader ? ['cyan'] : [],
                    border: ['grey'],
                    'padding-left': 1,
                    'padding-right': 1
                },
                wordWrap: true,
                wrapOnWordBoundary: false
            });

            if (hasHeader && tableData.length > 0) {
                // First row as header
                table.push(...tableData.slice(1));
                // Set header
                if (tableData[0]) {
                    table.options.head = tableData[0];
                }
            } else {
                tableData.forEach(row => table.push(row));
            }

            output += table.toString();
        } else {
            // Fallback to manual table
            output += this.createManualTable(tableData, { 
                headers: hasHeader,
                headerColor: 'cyan' 
            });
        }

        // Add truncation notices
        if (hasMoreRows) {
            output += '\n' + this.styler.muted(`... ${data.length - this.options.maxRows} more rows`);
        }
        if (hasMoreCols) {
            output += '\n' + this.styler.muted(`... ${maxCols - this.options.maxColumns} more columns`);
        }

        return output;
    }

    /**
     * Render plain text fallback
     * @param {string} content 
     * @returns {string}
     */
    renderPlainTextFallback(content) {
        const lines = content.split('\n').slice(0, 20);
        let output = this.styler.muted('Raw data (first 20 lines):') + '\n';
        output += this.styler.separator(this.options.maxWidth, '─', 'gray') + '\n';
        
        lines.forEach(line => {
            if (this.styler.getWidth(line) > this.options.maxWidth) {
                output += this.truncate(line, this.options.maxWidth) + '\n';
            } else {
                output += line + '\n';
            }
        });
        
        if (content.split('\n').length > 20) {
            output += this.styler.muted(`... ${content.split('\n').length - 20} more lines`);
        }
        
        return output;
    }
}