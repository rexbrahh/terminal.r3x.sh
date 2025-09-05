/**
 * Upload test files to Supabase database for enhanced file rendering system
 * Run this in browser console: new TestFileUploader().uploadAll()
 */

import { SupabaseAPI } from './api/supabase.js';

class TestFileUploader {
    constructor() {
        this.api = new SupabaseAPI();
        this.uploaded = [];
    }

    async uploadAll() {
        console.log('🚀 Starting test file upload to database...');
        
        try {
            // First, create the test-files directory
            await this.createTestFilesDirectory();
            
            // Then upload all test files
            await this.uploadTestFiles();
            
            console.log('✅ Upload completed successfully!');
            console.log(`📊 Uploaded ${this.uploaded.length} items:`);
            this.uploaded.forEach(item => {
                const icon = item.type === 'directory' ? '📁' : '📄';
                console.log(`  ${icon} ${item.path}`);
            });
            
        } catch (error) {
            console.error('❌ Upload failed:', error);
            throw error;
        }
    }

    async createTestFilesDirectory() {
        console.log('📂 Creating test-files directory...');
        
        const entry = {
            path: '/test-files',
            type: 'directory',
            title: 'Test Files',
            parent_path: null,
            published: true,
            sort_order: 6
        };

        const { error } = await this.api.supabase
            .from('site_content')
            .insert([entry]);

        if (error) {
            if (error.code === '23505') {
                console.log('  ℹ️ Directory already exists, skipping...');
                return;
            }
            throw error;
        }
        
        this.uploaded.push(entry);
        console.log('  ✅ Created directory: /test-files');
    }

    async uploadTestFiles() {
        const testFiles = [
            {
                path: '/test-files/sample.json',
                title: 'JSON Sample File',
                mime_type: 'application/json',
                content: \`{
  "name": "Enhanced File Rendering Test",
  "version": "1.0.0",
  "features": {
    "renderers": [
      {
        "name": "JSONRenderer",
        "types": ["json"],
        "priority": 9,
        "capabilities": ["pretty-printing", "syntax-highlighting", "structure-analysis"]
      },
      {
        "name": "CodeRenderer",
        "types": ["javascript", "python", "css", "html"],
        "priority": 8,
        "capabilities": ["syntax-highlighting", "line-numbers", "multiple-languages"]
      },
      {
        "name": "MarkdownRenderer",
        "types": ["markdown"],
        "priority": 10,
        "capabilities": ["headers", "tables", "code-blocks", "links"]
      }
    ],
    "statistics": {
      "total_renderers": 6,
      "supported_languages": 15,
      "file_types": 20
    }
  },
  "configuration": {
    "colors": true,
    "line_numbers": true,
    "max_width": 80,
    "show_metadata": false
  },
  "examples": [
    {"file": "example.js", "renderer": "CodeRenderer"},
    {"file": "config.py", "renderer": "CodeRenderer"},
    {"file": "test.md", "renderer": "MarkdownRenderer"}
  ]
}\`
            },
            {
                path: '/test-files/example.js',
                title: 'JavaScript Example',
                mime_type: 'text/javascript',
                content: \`/**
 * Example JavaScript file demonstrating syntax highlighting
 * This file tests various JavaScript features and patterns
 */

// Import statements
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

// Constants and configuration
const CONFIG = {
    maxRetries: 3,
    timeout: 5000,
    batchSize: 1000,
    defaultValues: {
        active: true,
        priority: 'medium',
        tags: []
    }
};

/**
 * Modern JavaScript class with async/await and error handling
 */
class DataProcessor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.config = { ...CONFIG, ...options };
        this.queue = [];
        this.processing = false;
        this.stats = { processed: 0, errors: 0 };
    }

    // Async method with comprehensive error handling
    async processData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }

        this.processing = true;
        const results = [];
        
        try {
            for (let i = 0; i < data.length; i += this.config.batchSize) {
                const batch = data.slice(i, i + this.config.batchSize);
                const processed = await this.processBatch(batch);
                results.push(...processed);
                
                // Emit progress event
                this.emit('progress', {
                    completed: i + batch.length,
                    total: data.length,
                    percentage: Math.round(((i + batch.length) / data.length) * 100)
                });
            }
            
            this.stats.processed += results.length;
            return results;
            
        } catch (error) {
            this.stats.errors++;
            this.emit('error', error);
            throw error;
        } finally {
            this.processing = false;
        }
    }

    // Private method with promise timeout
    async processBatch(batch) {
        return Promise.race([
            this.#processItems(batch),
            this.#timeout()
        ]);
    }

    // Private methods (modern JavaScript syntax)
    async #processItems(items) {
        return items.map(item => ({
            ...this.config.defaultValues,
            ...item,
            id: item.id || this.#generateId(),
            processed: true,
            timestamp: new Date().toISOString()
        }));
    }

    #timeout() {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Processing timeout')), this.config.timeout);
        });
    }

    #generateId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Static utility methods
    static validateData(data) {
        const errors = [];
        if (!data || typeof data !== 'object') {
            errors.push('Data must be an object');
        }
        return errors;
    }

    static async fromFile(filepath) {
        const data = await fs.readFile(filepath, 'utf8');
        return new DataProcessor(JSON.parse(data));
    }
}

// Arrow functions and destructuring
const utilities = {
    // Template literals and array methods
    formatResults: (results) => \\\`Processed \\\${results.length} items\\\`,
    
    // Async arrow function
    saveToFile: async (data, filename) => {
        const filepath = path.join(process.cwd(), filename);
        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        return filepath;
    },
    
    // Higher-order functions
    filterActive: (items) => items.filter(({ active = true }) => active),
    groupByTag: (items) => items.reduce((groups, item) => {
        const tag = item.tag || 'default';
        return { ...groups, [tag]: [...(groups[tag] || []), item] };
    }, {}),
    
    // Rest parameters and spread syntax
    mergeObjects: (...objects) => objects.reduce((merged, obj) => ({ ...merged, ...obj }), {})
};

// Export for module use
export { DataProcessor, utilities };
export default DataProcessor;\`
            },
            {
                path: '/test-files/config.py',
                title: 'Python Configuration',
                mime_type: 'text/x-python',
                content: \`#!/usr/bin/env python3
"""
Configuration management module demonstrating Python syntax highlighting
"""

import os
import json
import logging
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum
from contextlib import contextmanager

# Configure logging with detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('config.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class Environment(Enum):
    """Application environments"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

@dataclass
class DatabaseConfig:
    """Database configuration with validation"""
    host: str = "localhost"
    port: int = 5432
    database: str = "myapp"
    username: str = "user"
    password: str = "secret"
    ssl_mode: str = "require"
    pool_size: int = 20
    timeout: int = 30
    
    def __post_init__(self):
        """Validate configuration after initialization"""
        if not 1 <= self.port <= 65535:
            raise ValueError(f"Invalid port number: {self.port}")
        if self.pool_size < 1:
            raise ValueError("Pool size must be positive")
    
    @property
    def connection_string(self) -> str:
        """Generate database connection string"""
        return (f"postgresql://{self.username}:{self.password}"
                f"@{self.host}:{self.port}/{self.database}")

class ConfigManager:
    """Centralized configuration management"""
    
    def __init__(self, config_path: Optional[Path] = None, 
                 environment: Environment = Environment.DEVELOPMENT):
        self.config_path = config_path or Path("config.json")
        self.environment = environment
        self.config: Dict[str, Any] = {}
        self._watchers: List[callable] = []
        
        # Load configuration
        self._load_config()
        logger.info(f"Configuration loaded for {environment.value}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value with dot notation"""
        try:
            keys = key.split('.')
            value = self.config
            
            for k in keys:
                if isinstance(value, dict) and k in value:
                    value = value[k]
                else:
                    return default
            
            return value
        except (AttributeError, KeyError):
            return default

# Example usage and testing
if __name__ == "__main__":
    print("🔧 Configuration Manager Test")
    config = ConfigManager()
    print(f"Database Host: {config.get('database.host')}")
    print("✅ Configuration is valid")\`
            },
            {
                path: '/test-files/test.md',
                title: 'File Rendering System Demo',
                mime_type: 'text/markdown',
                content: \`# File Rendering System Demo

This file demonstrates the enhanced **MarkdownRenderer** capabilities in the terminal interface.

## Syntax Highlighting Features

The system now supports comprehensive syntax highlighting for multiple programming languages:

### JavaScript Example
\\\`\\\`\\\`javascript
// Modern JavaScript with async/await
async function fetchUserData(userId) {
    try {
        const response = await fetch(\\\`/api/users/\\\${userId}\\\`);
        const userData = await response.json();
        return { success: true, data: userData };
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return { success: false, error: error.message };
    }
}
\\\`\\\`\\\`

### Python Example  
\\\`\\\`\\\`python
def calculate_fibonacci(n: int) -> List[int]:
    """Generate Fibonacci sequence up to n numbers"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])
    
    return sequence

# Usage example
fib_numbers = calculate_fibonacci(10)
print(f"First 10 Fibonacci numbers: {fib_numbers}")
\\\`\\\`\\\`

## Table Rendering

The system renders tables with proper alignment and formatting:

| Renderer | File Types | Priority | Features |
|----------|------------|----------|----------|
| MarkdownRenderer | .md | 10 | Headers, tables, code blocks |
| JSONRenderer | .json | 9 | Pretty printing, structure analysis |  
| CodeRenderer | .js, .py, .css | 8 | Syntax highlighting, line numbers |
| ImageRenderer | .png, .jpg, .gif | 8 | ASCII art conversion |
| BinaryRenderer | Binary files | 3 | Hex dump, file analysis |
| TextRenderer | .txt, .log, .ini | 1 | Enhanced text display |

## List Examples

### Unordered Lists
- **Markdown rendering** with rich formatting
- **JSON pretty-printing** with structure analysis
- **Code syntax highlighting** for 15+ programming languages
- **Image ASCII art** conversion for visual files
- **Binary hex dumps** with detailed file analysis
- **Enhanced text display** with URL and path highlighting

### Ordered Lists
1. **File Detection** - Automatic type detection using extensions and content analysis
2. **Renderer Selection** - Priority-based selection with fallback mechanisms  
3. **Content Processing** - Language-specific parsing and formatting
4. **Output Generation** - Terminal-optimized display with colors and structure
5. **Error Handling** - Graceful degradation for unsupported or corrupted files

## Text Formatting

The renderer supports various **text formatting** options:

- *Italic text* using single asterisks
- **Bold text** using double asterisks
- ~~Strikethrough text~~ using tildes
- \\\`Inline code\\\` using backticks
- [Links with descriptions](https://example.com)
- Automatic URL detection: https://github.com/user/repo

## Blockquotes

> The enhanced rendering system transforms the terminal experience from plain text to rich, interactive content display.
> 
> Each renderer is specialized for its file type, providing optimal formatting and syntax highlighting while maintaining the authentic terminal aesthetic.

---

**Testing Status**: ✅ All renderers implemented and functional

*Use \\\`cat /test-files/sample.json\\\` to see JSON rendering in action!*\`
            },
            {
                path: '/test-files/demo.css',
                title: 'CSS Demonstration',
                mime_type: 'text/css',
                content: \`/* Modern CSS demonstrating syntax highlighting */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;700&display=swap');

/* CSS Custom Properties (Variables) */
:root {
    --primary-color: #007acc;
    --secondary-color: #ff6b35;
    --accent-color: #4ecdc4;
    --text-color: #333333;
    --background-color: #ffffff;
    --border-color: #e0e0e0;
    --shadow-color: rgba(0, 0, 0, 0.1);
    
    /* Spacing system */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    --space-xxl: 3rem;
}

/* Dark theme override */
@media (prefers-color-scheme: dark) {
    :root {
        --text-color: #ffffff;
        --background-color: #1a1a1a;
        --border-color: #333333;
        --shadow-color: rgba(255, 255, 255, 0.1);
    }
}

/* Base styles with modern CSS features */
*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: var(--font-size-base);
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--background-color);
    transition: color var(--transition-normal), background-color var(--transition-normal);
}

/* Typography with modern CSS features */
h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: var(--space-md);
    color: var(--primary-color);
}

/* Modern link styles */
a {
    color: var(--primary-color);
    text-decoration: none;
    position: relative;
    transition: color var(--transition-fast);
}

a::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
    transition: width var(--transition-normal);
}

a:hover::after,
a:focus::after {
    width: 100%;
}\`
            },
            {
                path: '/test-files/data.csv',
                title: 'Sample CSV Data',
                mime_type: 'text/csv',
                content: \`name,age,city,occupation,salary,active
John Doe,30,New York,Software Engineer,95000,true
Jane Smith,28,San Francisco,Product Manager,110000,true
Mike Johnson,35,Seattle,DevOps Engineer,85000,true
Sarah Wilson,32,Austin,UX Designer,75000,false
David Brown,29,Boston,Data Scientist,90000,true
Lisa Davis,31,Chicago,Marketing Manager,80000,true
Robert Taylor,38,Denver,Solution Architect,120000,true
Emily Anderson,27,Portland,Frontend Developer,70000,true
James Wilson,33,Miami,Backend Developer,85000,false
Jennifer Lee,30,San Diego,Mobile Developer,78000,true\`
            },
            {
                path: '/test-files/README.txt',
                title: 'Test Files Documentation',
                mime_type: 'text/plain',
                content: \`Enhanced File Rendering System - Test Files
==========================================

This directory contains sample files to demonstrate the various renderers
implemented in the terminal.r3x.sh file rendering system.

File Types and Renderers:
------------------------

1. sample.json - JSONRenderer Demo
   * Pretty-printed JSON with syntax highlighting
   * Structure analysis showing keys, depth, arrays
   * Error handling for invalid JSON format

2. example.js - CodeRenderer Demo  
   * JavaScript syntax highlighting with keywords, strings, comments
   * Line numbers and proper indentation
   * Support for modern JS features (async/await, destructuring, etc.)

3. config.py - CodeRenderer Demo
   * Python syntax highlighting with decorators and type hints  
   * Function definitions, imports, and string literals
   * Class definitions and method signatures

4. test.md - MarkdownRenderer Demo
   * Headers, lists, tables, and blockquotes
   * Code blocks with language-specific highlighting
   * Links, emphasis, and inline code formatting

5. demo.css - CodeRenderer Demo
   * CSS syntax highlighting for selectors, properties, values
   * Color detection and media query formatting
   * Modern CSS features like custom properties

6. data.csv - TextRenderer Demo
   * Enhanced text display with column alignment
   * URL and file path highlighting
   * Number and quoted string detection

7. README.txt - TextRenderer Demo
   * Basic text enhancement with minimal formatting
   * Automatic detection of patterns and structures
   * Fallback renderer for unknown file types

Usage Examples:
--------------

Try these commands to see the renderers in action:

  cat sample.json          # JSON pretty-printing with colors
  cat example.js           # JavaScript syntax highlighting
  cat config.py            # Python code with line numbers
  cat test.md              # Markdown with rich formatting
  cat demo.css             # CSS with property highlighting
  cat data.csv             # CSV data with text enhancements
  cat README.txt           # This file with basic text rendering

Options:
-------

All renderers support these common options:

  cat -m [file]           # Show file metadata
  cat --no-color [file]   # Disable color output
  cat -w 60 [file]        # Set display width to 60 characters

Technical Details:
-----------------

The rendering system uses a priority-based approach:

1. MarkdownRenderer (priority: 10) - .md files
2. JSONRenderer (priority: 9) - .json files  
3. CodeRenderer (priority: 8) - .js, .py, .css, .html, etc.
4. ImageRenderer (priority: 8) - .png, .jpg, .gif, etc.
5. BinaryRenderer (priority: 3) - Binary files
6. TextRenderer (priority: 1) - Fallback for all other files

Each renderer extends BaseRenderer and implements:
- canRender(fileType) - File type compatibility check
- getPriority() - Renderer selection priority
- render(content, filename, metadata) - Main rendering logic

The system automatically detects file types using:
- File extensions (.js, .py, .md, etc.)
- Content analysis for ambiguous files
- Magic number detection for binary files

Architecture:
------------

FileTypeDetector -> RendererRegistry -> Selected Renderer -> Formatted Output

This modular approach allows easy addition of new renderers and file types
without modifying existing code.

Performance:
-----------

- Large files are truncated with warnings
- Binary files show hex dumps up to 2KB by default  
- Code files limited to 1000 lines for syntax highlighting
- JSON files show structure analysis for complex objects

The system balances rich formatting with terminal performance constraints.

---

For more information about the rendering system, see the source code in:
/rendering/RendererRegistry.js and /rendering/renderers/ directory.\`
            }
        ];

        for (const fileData of testFiles) {
            await this.uploadFile(fileData);
        }
    }

    async uploadFile(fileData) {
        console.log(\`📄 Uploading \${fileData.path}...\`);
        
        const entry = {
            ...fileData,
            type: 'file',
            parent_path: '/test-files',
            published: true,
            sort_order: 999
        };

        const { error } = await this.api.supabase
            .from('site_content')
            .insert([entry]);

        if (error) {
            if (error.code === '23505') {
                console.log(\`  ℹ️ File already exists, updating...\`);
                
                // Try updating instead
                const { error: updateError } = await this.api.supabase
                    .from('site_content')
                    .update(entry)
                    .eq('path', fileData.path);
                
                if (updateError) throw updateError;
                console.log(\`  ✅ Updated file: \${fileData.path}\`);
            } else {
                throw error;
            }
        } else {
            console.log(\`  ✅ Created file: \${fileData.path}\`);
        }
        
        this.uploaded.push(entry);
    }

    // Utility method to delete test files if needed
    async deleteTestFiles() {
        console.log('🗑️ Deleting test files from database...');
        
        const { error } = await this.api.supabase
            .from('site_content')
            .delete()
            .like('path', '/test-files%');
        
        if (error) throw error;
        console.log('✅ Test files deleted');
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.TestFileUploader = TestFileUploader;
    console.log('📋 TestFileUploader available in browser console');
    console.log('Run: new TestFileUploader().uploadAll()');
} else {
    export { TestFileUploader };
}\`