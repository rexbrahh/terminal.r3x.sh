/**
 * Example JavaScript file to test syntax highlighting
 */

// Import statements
import { EventEmitter } from 'events';
import fs from 'fs/promises';

// Class definition with modern JavaScript features
class DataProcessor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            batchSize: 1000,
            timeout: 5000,
            retries: 3,
            ...config
        };
        this.queue = [];
        this.isProcessing = false;
    }

    // Async method with error handling
    async processData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }

        const results = [];
        
        for (let i = 0; i < data.length; i += this.config.batchSize) {
            const batch = data.slice(i, i + this.config.batchSize);
            
            try {
                const processedBatch = await this.processBatch(batch);
                results.push(...processedBatch);
                
                // Emit progress event
                this.emit('progress', {
                    processed: i + batch.length,
                    total: data.length,
                    percentage: Math.round(((i + batch.length) / data.length) * 100)
                });
                
            } catch (error) {
                console.error(`Failed to process batch ${i}:`, error);
                this.emit('error', error);
            }
        }
        
        return results;
    }

    // Private method with promise timeout
    async processBatch(batch) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Batch processing timeout'));
            }, this.config.timeout);

            // Simulate async processing
            setTimeout(() => {
                clearTimeout(timer);
                const processed = batch.map(item => ({
                    ...item,
                    processed: true,
                    timestamp: new Date().toISOString()
                }));
                resolve(processed);
            }, Math.random() * 1000);
        });
    }

    // Static utility method
    static validateConfig(config) {
        const required = ['batchSize', 'timeout', 'retries'];
        const missing = required.filter(key => !(key in config));
        
        if (missing.length > 0) {
            throw new Error(`Missing required config: ${missing.join(', ')}`);
        }
        
        return true;
    }
}

// Export and usage example
export default DataProcessor;

// Example usage
if (import.meta.url === new URL(import.meta.resolve('./example.js'))) {
    const processor = new DataProcessor({ batchSize: 5 });
    
    processor.on('progress', (progress) => {
        console.log(`Progress: ${progress.percentage}%`);
    });
    
    processor.on('error', (error) => {
        console.error('Processing error:', error.message);
    });
    
    const testData = Array.from({ length: 50 }, (_, i) => ({ id: i, value: Math.random() }));
    
    processor.processData(testData)
        .then(results => console.log('Processing complete:', results.length, 'items'))
        .catch(error => console.error('Failed:', error.message));
}