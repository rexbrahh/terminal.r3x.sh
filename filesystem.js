export class FileSystem {
    constructor() {
        this.root = {
            '/': {
                type: 'directory',
                children: ['home', 'blogs', 'projects', 'now', 'about.md', 'test-files'],
                permissions: 'drwxr-xr-x',
                modified: new Date()
            },
            '/home': {
                type: 'directory',
                children: ['README.md', '.bashrc'],
                permissions: 'drwxr-xr-x',
                modified: new Date()
            },
            '/home/README.md': {
                type: 'file',
                content: `# Welcome to terminal.r3x.sh

This is Rex Liu's personal website, reimagined as a Unix terminal interface. Experience web browsing the way it was meant to be - through the power of the command line.

## Getting Started

If you're new to terminal interfaces, don't worry! This site is designed to be intuitive while maintaining the authenticity of a real Unix system.

### Basic Navigation

Use these familiar Unix commands to explore:
- \`ls\` - List directory contents
- \`cd [directory]\` - Change directory
- \`cat [file]\` - Read files and documents
- \`pwd\` - Show current directory path
- \`clear\` - Clear the terminal screen
- \`help\` - Show all available commands

### Quick Start Guide

1. Type \`ls\` to see what's available
2. Use \`cd /blog\` to read my latest posts
3. Check out \`cat /about\` to learn about me
4. See \`cat /now\` for what I'm currently working on
5. Explore \`cd /projects\` for my development work

## Site Features

- **Full Unix Command Set**: Familiar commands with authentic behavior
- **Tab Completion**: Press Tab to autocomplete commands and paths
- **Command History**: Use ↑/↓ arrows to navigate previous commands
- **Markdown Rendering**: Beautiful content formatting in terminal style
- **Mobile Friendly**: Works great on phones and tablets

## About This Terminal

This isn't just a gimmick - it's a fully functional terminal interface built with modern web technologies. The virtual filesystem contains real content that you can explore just like a traditional Unix system.

Built with xterm.js, vanilla JavaScript, and a passion for the command line.

---

*Ready to explore? Type \`help\` to see all available commands, or just start with \`ls\` to look around!*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/home/.bashrc': {
                type: 'file',
                content: `# .bashrc - Terminal configuration
# This is a virtual file for authenticity :)

export PS1="\\u@\\h:\\w\\$ "
alias ll="ls -la"
alias ..="cd .."
alias ~="cd /home"

# Welcome message
echo "Welcome back, guest!"`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/blogs/2024-01-15-hello-world.md': {
                type: 'file',
                content: `# Hello, World!
*January 15, 2024*

Welcome to my terminal-based blog. This is where I share thoughts on technology, programming, and the intersection of both with everyday life.

## Why a Terminal Interface?

I've always been fascinated by the elegance of command-line interfaces. They represent a pure, distraction-free way to interact with information. No pop-ups, no autoplay videos, just text and intention.

## What to Expect

Here you'll find:
- Technical deep-dives
- Project updates
- Thoughts on software design
- Occasional musings on technology's impact

Stay tuned for more posts. Navigate with \`cd /blog\` and \`ls\` to see all posts.`,
                permissions: '-rw-r--r--',
                modified: new Date('2024-01-15')
            },
            '/blogs/2024-02-20-building-terminal-ui.md': {
                type: 'file',
                content: `# Building a Terminal UI for the Modern Web
*February 20, 2024*

## The Challenge

How do you create a terminal interface that feels authentic yet remains accessible to modern web users? This post explores the technical decisions behind terminal.r3x.sh.

## Technology Stack

- **xterm.js**: The foundation for terminal emulation
- **Virtual Filesystem**: Pure JavaScript implementation
- **Markdown Rendering**: Preserving readability in terminal format

## Key Features

1. **Command History**: Use arrow keys to navigate previous commands
2. **Tab Completion**: Start typing and press Tab
3. **Familiar Commands**: ls, cd, cat, and more
4. **Interactive Navigation**: Combine mouse and keyboard

## Lessons Learned

Building this interface taught me that constraints breed creativity. By limiting ourselves to text-based interaction, we focus on content and functionality over flashy visuals.

## Code Snippet

\`\`\`javascript
class VirtualFileSystem {
    constructor() {
        this.root = this.initializeFilesystem();
    }
    
    navigate(path) {
        // Simple path resolution
        return this.root[path] || null;
    }
}
\`\`\`

## Future Plans

- Implementing grep for searching
- Adding vim-style navigation
- Creating a package manager simulation

Try exploring the filesystem yourself!`,
                permissions: '-rw-r--r--',
                modified: new Date('2024-02-20')
            },
            '/blogs/2024-03-10-unix-philosophy.md': {
                type: 'file',
                content: `# Embracing the Unix Philosophy in Web Development
*March 10, 2024*

## Do One Thing Well

The Unix philosophy teaches us powerful lessons applicable far beyond terminal commands. At its core: "Do one thing and do it well."

## Principles in Practice

### 1. Modularity
Each command in this terminal serves a single purpose:
- \`ls\` lists files
- \`cat\` displays content
- \`cd\` changes directories

### 2. Composition
Commands can work together through pipes and redirection (coming soon to this terminal!)

### 3. Plain Text
Everything is text. No proprietary formats, no complex parsers needed.

## Web Development Applications

These principles translate beautifully to modern web development:

- **Microservices** embody the "do one thing well" principle
- **REST APIs** use plain text (JSON) for universal compatibility
- **Unix tools** remain relevant in our CI/CD pipelines

## A Personal Reflection

This terminal website itself is an exercise in these principles. It does one thing: provide a terminal interface to web content. No more, no less.

## Conclusion

Sometimes the old ways are the best ways. The Unix philosophy has survived for over 50 years because it works. As developers, we should remember these timeless principles.

*"Simplicity is the ultimate sophistication." - Leonardo da Vinci*`,
                permissions: '-rw-r--r--',
                modified: new Date('2024-03-10')
            },
            '/blogs': {
                type: 'directory',
                children: ['README.md'], // Only static files, dynamic posts will be added by ls command
                permissions: 'drwxr-xr-x',
                modified: new Date()
            },
            '/blogs/README.md': {
                type: 'file',
                content: `# Blog Section

Welcome to my blog! Here you'll find my thoughts on technology, programming, and life.

## Recent Posts

Navigate to individual posts in the \`/blog\` directory:
- \`cat /blog/2024-03-10-unix-philosophy.md\` - Unix Philosophy in Web Development
- \`cat /blog/2024-02-20-building-terminal-ui.md\` - Building Terminal UIs
- \`cat /blog/2024-01-15-hello-world.md\` - Hello World

## Categories

- **Technical**: Deep dives into programming and technology
- **Philosophy**: Thoughts on development practices and principles
- **Projects**: Updates and insights from my work

## Archive

Use \`ls /blog\` to see all posts, or check \`cat /blogs/archive.md\` for a chronological list.

---
*All posts are written in Markdown and optimized for terminal reading.*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/blogs/categories.md': {
                type: 'file',
                content: `# Blog Categories

## Technical Posts
- Building Terminal UIs for the Web
- Unix Philosophy in Modern Development
- JavaScript Module Systems
- Performance Optimization Techniques

## Philosophy & Practices
- The Art of Simple Code
- Why Documentation Matters
- Open Source Contributions
- Work-Life Balance in Tech

## Project Updates
- Terminal Web Framework Development
- Personal Website Evolution
- Side Project Experiments
- Learning New Technologies

## Meta
- About This Blog
- Writing Process
- Tools and Setup
- Future Plans

---
*Navigate back with \`cd ..\` or explore posts with \`ls /blog\`*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/blogs/archive.md': {
                type: 'file',
                content: `# Blog Archive

## 2024

### March
- **2024-03-10**: Embracing the Unix Philosophy in Web Development
  - Tags: philosophy, unix, development
  - Length: 5 min read

### February  
- **2024-02-20**: Building a Terminal UI for the Modern Web
  - Tags: technical, web-development, terminal
  - Length: 8 min read

### January
- **2024-01-15**: Hello, World!
  - Tags: introduction, meta
  - Length: 3 min read

## Coming Soon

- Advanced Terminal Commands Implementation
- State Management in Vanilla JavaScript
- Progressive Web App Features
- Mobile Terminal Experience

## Statistics

- Total posts: 3
- Total words: ~2,500
- Most popular: Building Terminal UIs
- Most recent: Unix Philosophy

---
*Use \`cat /blog/[filename]\` to read any post*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/projects': {
                type: 'directory',
                children: ['terminal-web.md', 'other-projects.md'],
                permissions: 'drwxr-xr-x',
                modified: new Date()
            },
            '/projects/terminal-web.md': {
                type: 'file',
                content: `# Terminal Web Framework

An open-source framework for creating terminal-style websites.

## Features
- Easy to integrate
- Customizable themes
- Plugin system
- Virtual filesystem
- Command extensibility

## Installation
\`\`\`bash
npm install terminal-web
\`\`\`

## Usage
\`\`\`javascript
import { TerminalSite } from 'terminal-web';

const site = new TerminalSite({
    filesystem: yourContent,
    theme: 'matrix'
});
\`\`\`

## Status
Currently in development. This very site is the proof of concept!

GitHub: [coming soon]`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/projects/other-projects.md': {
                type: 'file',
                content: `# Other Projects

## Active Projects

### Project Alpha
A machine learning experiment in natural language processing.
- Status: In Progress
- Tech: Python, TensorFlow
- GitHub: [private]

### Data Visualizer
Interactive data visualization tool for complex datasets.
- Status: Beta
- Tech: D3.js, React
- Demo: [coming soon]

## Past Projects

### WebSocket Chat
Real-time chat application using WebSockets.
- Tech: Node.js, Socket.io
- Learned: Real-time communication patterns

### CLI Task Manager
Command-line task management tool.
- Tech: Rust
- Learned: Systems programming, CLI design

---

For more details on any project, feel free to reach out!`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/now': {
                type: 'directory',
                children: ['README.md', 'projects.md', 'learning.md'],
                permissions: 'drwxr-xr-x',
                modified: new Date()
            },
            '/now/README.md': {
                type: 'file',
                content: `# What I'm Doing Now

*Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*

This is my [now page](https://nownownow.com/about) - inspired by Derek Sivers. It's a living document of what I'm currently focused on.

## Primary Focus

### terminal.r3x.sh Development
Building this terminal-based website you're currently exploring. Core functionality is complete, now adding content and polish.

### Terminal Web Framework
Extracting the core functionality into a reusable open-source framework called "Terminal Web".

## Current Status
- Architecture planning and API design
- Building developer tools and utilities
- Contributing to open-source projects

---

*Navigate with \`ls\` to see more details, or \`cd ..\` to go back to root.*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/about.md': {
                type: 'file',
                content: `# About Rex Liu

## Software Engineer & Terminal Enthusiast

I'm a software engineer passionate about creating elegant, efficient solutions that make technology more accessible and enjoyable. I believe in the power of simplicity and the beauty of well-crafted code.

## What Drives Me

### Philosophy
I believe technology should be:
- **Accessible** - Available to everyone, regardless of background
- **Efficient** - Respectful of resources and user time
- **Elegant** - Beautiful in its simplicity and design
- **Useful** - Solving real problems that matter

### Interests
- **Systems Programming** - Low-level performance and efficiency
- **Web Technologies** - Modern, fast, and accessible web experiences
- **Command-Line Interfaces** - The elegance of text-based interaction
- **Open-Source Software** - Collaborative development and knowledge sharing
- **Minimalist Design** - Less is more, function over form

## Technical Skills

### Programming Languages
- **JavaScript/TypeScript** - Full-stack web development
- **Python** - Scripting, automation, and data processing
- **Rust** - Systems programming and performance-critical applications
- **Go** - Backend services and tooling
- **Shell/Bash** - Automation and system administration

### Technologies & Tools
- **Frontend**: React, Vue, Vanilla JS, HTML5, CSS3
- **Backend**: Node.js, Express, FastAPI, REST APIs
- **Databases**: PostgreSQL, MongoDB, Redis
- **DevOps**: Docker, Kubernetes, AWS, CI/CD
- **Tools**: Git, Vim, tmux, Linux/Unix systems

## Current Projects

### terminal.r3x.sh
The website you're currently exploring! A fully functional terminal interface for web browsing, built with xterm.js and vanilla JavaScript.

### Terminal Web Framework
Extracting the core functionality into a reusable open-source framework so others can create their own terminal-style websites.

### Open Source Contributions
Regular contributor to various open-source projects, with a focus on developer tools and web technologies.

## Personal Side

### Fun Facts
- I use vim (and actually know how to exit it!)
- My first computer was a Commodore 64
- I've contributed to 50+ open-source projects
- Terminal multiplexer of choice: tmux
- I can solve a Rubik's cube in under 2 minutes

### Current Learning
- **Rust** - Building system-level tools and exploring WebAssembly
- **Distributed Systems** - Understanding consensus algorithms and scalability
- **Music Production** - Learning to play the synthesizer
- **Gardening** - Growing herbs and vegetables

### Life Balance
- Working remotely from various locations
- Daily meditation practice for mental clarity
- Regular hiking and outdoor activities
- Continuous learning through books and experiments

## Get In Touch

While this terminal doesn't have real email integration yet, you can:
- Explore my work through the projects section (\`cd projects\`)
- Read my thoughts in the blogs (\`cd blogs\`)
- See what I'm up to now (\`cd now\`)

### Coming Soon
- GitHub integration
- LinkedIn connection
- Contact form
- RSS feed

---

*"The terminal is not just a tool, it's a philosophy of interaction."*

*Want to see what I'm currently working on? Check out \`cd now\`*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/now/projects.md': {
                type: 'file',
                content: `# Current Projects

## Primary Development Focus

### terminal.r3x.sh
The website you're currently exploring! A fully functional terminal interface for web browsing.

**Status**: Core functionality complete, adding content and polish
**Tech**: xterm.js, vanilla JavaScript, virtual filesystem
**Goal**: Showcase terminal-style web interfaces

### Terminal Web Framework
Extracting core functionality into a reusable open-source framework called "Terminal Web".

**Status**: Architecture planning and API design  
**Goal**: Enable other developers to create terminal-style websites
**Timeline**: MVP planned for Q1 2025

## Side Projects

### Open Source Contributions
- Contributing to terminal emulator projects
- Improving documentation for JavaScript libraries
- Building developer tools and utilities

### Personal Experiments
- **Knowledge Base** - Personal wiki using Obsidian and custom scripts
- **Generative Art** - Algorithmic art using Processing and p5.js  
- **CLI Tools** - Productivity tools for daily workflow

---

*Navigate back with \`cd ..\` or explore \`cat learning.md\`*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/now/learning.md': {
                type: 'file',
                content: `# Current Learning

## Technical Skills

### Rust Programming
- Building system-level tools
- Exploring WebAssembly integration
- Memory safety and performance optimization

### Advanced JavaScript
- Performance optimization techniques
- Modern patterns and best practices
- Deep dive into runtime behavior

### Distributed Systems
- Consensus algorithms and eventual consistency
- Scaling patterns and reliability
- CAP theorem in practice

### Web Performance
- Core Web Vitals optimization
- Accessibility improvements  
- Mobile-first development

## Reading List

### Currently Reading
- "The Unix Programming Environment" by Kernighan & Pike
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "The Pragmatic Programmer" (20th Anniversary Edition)

### Next Up
- "Systems Performance" by Brendan Gregg
- "High Performance Browser Networking" by Ilya Grigorik
- "Clean Architecture" by Robert Martin

## Personal Development

### Creative Skills
- **Music Production** - Learning synthesizer and digital audio
- **Generative Art** - Mathematical art using code
- **Photography** - Composition and light techniques

### Life Skills
- **Gardening** - Permaculture and sustainable growing
- **Meditation** - Mindfulness and focus techniques
- **Language Learning** - Improving technical writing

---

*Check out \`cat projects.md\` for current work, or \`cd ..\` to go back*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/test-files': {
                type: 'directory',
                children: ['sample.json', 'example.js', 'config.py', 'test.md', 'demo.css', 'data.csv', 'README.txt'],
                permissions: 'drwxr-xr-x',
                modified: new Date()
            },
            '/test-files/sample.json': {
                type: 'file',
                content: `{
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
}`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/test-files/example.js': {
                type: 'file',
                content: `/**
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
    formatResults: (results) => \`Processed \${results.length} items\`,
    
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
export default DataProcessor;

// Example usage with modern JavaScript features
if (import.meta.url === new URL(import.meta.resolve('./example.js'))) {
    console.log('🚀 Running DataProcessor example...');
    
    const processor = new DataProcessor({ batchSize: 5 });
    
    // Event listeners
    processor.on('progress', ({ percentage }) => {
        console.log(\`Progress: \${percentage}%\`);
    });
    
    processor.on('error', (error) => {
        console.error('❌ Error:', error.message);
    });
    
    // Test data generation
    const testData = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: \`Item \${i + 1}\`,
        value: Math.random() * 100,
        active: Math.random() > 0.2,
        tag: ['urgent', 'normal', 'low'][Math.floor(Math.random() * 3)]
    }));
    
    // Process and display results
    processor.processData(testData)
        .then(results => {
            console.log('✅ Processing complete!');
            console.log(\`Results: \${utilities.formatResults(results)}\`);
            
            const activeItems = utilities.filterActive(results);
            const groupedItems = utilities.groupByTag(activeItems);
            
            console.log('📊 Statistics:');
            console.log(\`- Active items: \${activeItems.length}\`);
            console.log(\`- Groups: \${Object.keys(groupedItems).join(', ')}\`);
        })
        .catch(error => {
            console.error('💥 Failed:', error.message);
        });
}`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/test-files/config.py': {
                type: 'file',
                content: `#!/usr/bin/env python3
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

@dataclass  
class APIConfig:
    """API server configuration"""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    workers: int = field(default_factory=lambda: os.cpu_count() or 1)
    cors_origins: List[str] = field(default_factory=list)
    rate_limit: int = 100
    
    def validate(self) -> List[str]:
        """Validate API configuration"""
        errors = []
        if not 1024 <= self.port <= 65535:
            errors.append(f"Invalid port: {self.port}")
        if self.workers < 1:
            errors.append("Workers must be positive")
        if self.rate_limit < 1:
            errors.append("Rate limit must be positive")
        return errors

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
    
    def _load_config(self) -> None:
        """Load configuration from file with error handling"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    self.config = json.load(f)
                logger.info(f"Configuration loaded from {self.config_path}")
            else:
                self._create_default_config()
                logger.warning("Config file not found, created default")
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to load config: {e}")
            self._create_default_config()
    
    def _create_default_config(self) -> None:
        """Create default configuration"""
        self.config = {
            'environment': self.environment.value,
            'database': DatabaseConfig().__dict__,
            'api': APIConfig().__dict__,
            'cache': {
                'type': 'redis',
                'host': 'localhost',
                'port': 6379,
                'db': 0,
                'ttl': 3600,
                'max_connections': 10
            },
            'features': {
                'enable_auth': True,
                'enable_logging': True,
                'enable_metrics': self.environment != Environment.DEVELOPMENT,
                'max_file_size': 10 * 1024 * 1024,  # 10MB
                'allowed_extensions': ['.jpg', '.png', '.pdf', '.txt']
            },
            'security': {
                'secret_key': os.urandom(32).hex(),
                'token_expiry': 3600,
                'bcrypt_rounds': 12,
                'cors_enabled': True
            }
        }
        self.save_config()
    
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
    
    def set(self, key: str, value: Any) -> None:
        """Set configuration value with dot notation"""
        keys = key.split('.')
        config = self.config
        
        # Navigate to parent dictionary
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        # Set the value and notify watchers
        old_value = config.get(keys[-1])
        config[keys[-1]] = value
        
        logger.info(f"Configuration updated: {key} = {value}")
        self._notify_watchers(key, old_value, value)
    
    def save_config(self) -> None:
        """Save configuration to file"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            logger.info(f"Configuration saved to {self.config_path}")
        except IOError as e:
            logger.error(f"Failed to save config: {e}")
            raise
    
    @contextmanager
    def temporary_config(self, updates: Dict[str, Any]):
        """Context manager for temporary configuration changes"""
        original_values = {}
        
        try:
            # Apply temporary changes
            for key, value in updates.items():
                original_values[key] = self.get(key)
                self.set(key, value)
            
            yield self
        
        finally:
            # Restore original values
            for key, original_value in original_values.items():
                if original_value is not None:
                    self.set(key, original_value)
    
    def add_watcher(self, callback: callable) -> None:
        """Add configuration change watcher"""
        if callback not in self._watchers:
            self._watchers.append(callback)
    
    def remove_watcher(self, callback: callable) -> None:
        """Remove configuration change watcher"""
        if callback in self._watchers:
            self._watchers.remove(callback)
    
    def _notify_watchers(self, key: str, old_value: Any, new_value: Any) -> None:
        """Notify all watchers of configuration changes"""
        for watcher in self._watchers:
            try:
                watcher(key, old_value, new_value)
            except Exception as e:
                logger.error(f"Watcher error: {e}")
    
    def validate_all(self) -> List[str]:
        """Validate entire configuration"""
        errors = []
        
        # Validate database config
        try:
            db_config = DatabaseConfig(**self.get('database', {}))
        except (TypeError, ValueError) as e:
            errors.append(f"Database config error: {e}")
        
        # Validate API config
        try:
            api_config = APIConfig(**self.get('api', {}))
            errors.extend(api_config.validate())
        except (TypeError, ValueError) as e:
            errors.append(f"API config error: {e}")
        
        # Validate features
        max_size = self.get('features.max_file_size', 0)
        if max_size and max_size < 1024:
            errors.append("Max file size too small (minimum 1KB)")
        
        return errors
    
    def reload(self) -> None:
        """Reload configuration from file"""
        logger.info("Reloading configuration...")
        self._load_config()
        
        # Validate after reload
        errors = self.validate_all()
        if errors:
            logger.warning(f"Configuration validation errors: {errors}")
        else:
            logger.info("Configuration reloaded successfully")

# Singleton pattern for global config access
_config_instance: Optional[ConfigManager] = None

def get_config() -> ConfigManager:
    """Get global configuration instance"""
    global _config_instance
    if _config_instance is None:
        env = Environment(os.getenv('APP_ENV', 'development'))
        config_path = os.getenv('CONFIG_PATH')
        _config_instance = ConfigManager(
            Path(config_path) if config_path else None,
            env
        )
    return _config_instance

# Decorator for configuration-dependent functions
def requires_config(config_key: str):
    """Decorator to ensure configuration value exists"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            config = get_config()
            if config.get(config_key) is None:
                raise ValueError(f"Missing required configuration: {config_key}")
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Example usage and testing
if __name__ == "__main__":
    print("🔧 Configuration Manager Test")
    print("=" * 40)
    
    # Initialize configuration
    config = get_config()
    
    # Display current configuration
    print(f"Environment: {config.get('environment')}")
    print(f"Database Host: {config.get('database.host')}")
    print(f"API Port: {config.get('api.port')}")
    print(f"Debug Mode: {config.get('api.debug')}")
    
    # Test validation
    errors = config.validate_all()
    if errors:
        print("\\n❌ Configuration Errors:")
        for error in errors:
            print(f"  - {error}")
    else:
        print("\\n✅ Configuration is valid")
    
    # Test watchers
    def config_watcher(key: str, old_value: Any, new_value: Any):
        print(f"📢 Config changed: {key} = {old_value} -> {new_value}")
    
    config.add_watcher(config_watcher)
    
    # Test temporary configuration
    print("\\n🔄 Testing temporary configuration...")
    with config.temporary_config({'api.debug': True, 'api.port': 9000}):
        print(f"Temporary debug mode: {config.get('api.debug')}")
        print(f"Temporary port: {config.get('api.port')}")
    
    print(f"Restored debug mode: {config.get('api.debug')}")
    print(f"Restored port: {config.get('api.port')}")`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/test-files/test.md': {
                type: 'file',
                content: `# File Rendering System Demo

This file demonstrates the enhanced **MarkdownRenderer** capabilities in the terminal interface.

## Syntax Highlighting Features

The system now supports comprehensive syntax highlighting for multiple programming languages:

### JavaScript Example
\`\`\`javascript
// Modern JavaScript with async/await
async function fetchUserData(userId) {
    try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const userData = await response.json();
        return { success: true, data: userData };
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return { success: false, error: error.message };
    }
}
\`\`\`

### Python Example  
\`\`\`python
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
\`\`\`

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
- \`Inline code\` using backticks
- [Links with descriptions](https://example.com)
- Automatic URL detection: https://github.com/user/repo

## Blockquotes

> The enhanced rendering system transforms the terminal experience from plain text to rich, interactive content display.
> 
> Each renderer is specialized for its file type, providing optimal formatting and syntax highlighting while maintaining the authentic terminal aesthetic.

## Code Blocks

Here's a CSS example demonstrating syntax highlighting:

\`\`\`css
/* Modern CSS with custom properties */
:root {
    --primary-color: #007acc;
    --secondary-color: #f0f0f0;
    --border-radius: 8px;
    --transition: all 0.3s ease;
}

.terminal-renderer {
    background: linear-gradient(135deg, #1e1e1e, #2d2d2d);
    color: #ffffff;
    font-family: 'Fira Code', 'Courier New', monospace;
    padding: 1rem;
    border-radius: var(--border-radius);
    transition: var(--transition);
}

.terminal-renderer:hover {
    box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
    transform: translateY(-2px);
}
\`\`\`

## Horizontal Rules

---

## Complex Nested Content

### Nested Lists with Code

1. **Setup Phase**
   - Initialize rendering system
   - Register all available renderers
   - Configure color schemes and options
   
2. **Detection Phase**  
   - Analyze file extension: \`.js\`, \`.py\`, \`.md\`, etc.
   - Examine file content for magic numbers
   - Apply priority-based renderer selection
   
3. **Processing Phase**
   - Parse content using language-specific rules
   - Apply syntax highlighting patterns
   - Format output for terminal display

### Configuration Example

The system can be configured through options:

\`\`\`json
{
    "renderers": {
        "markdown": {
            "showMetadata": true,
            "maxWidth": 80,
            "colorOutput": true
        },
        "code": {
            "showLineNumbers": true,
            "tabSize": 4,
            "highlightSyntax": true
        },
        "json": {
            "indent": 2,
            "maxDepth": 10,
            "showTypes": true
        }
    }
}
\`\`\`

---

**Testing Status**: ✅ All renderers implemented and functional

*Use \`cat /test-files/sample.json\` to see JSON rendering in action!*`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/test-files/demo.css': {
                type: 'file',
                content: `/* Modern CSS demonstrating syntax highlighting */
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
    
    /* Typography scale */
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-xxl: 1.5rem;
    --font-size-display: 2rem;
    
    /* Animation settings */
    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.5s ease;
    
    /* Border radius scale */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 50%;
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

html {
    font-size: 16px;
    scroll-behavior: smooth;
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

h1 { 
    font-size: var(--font-size-display); 
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

h2 { font-size: var(--font-size-xxl); }
h3 { font-size: var(--font-size-xl); }

p {
    margin-bottom: var(--space-md);
    max-width: 65ch;
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
}

/* Container with modern layout */
.container {
    max-width: min(100% - 2rem, 1200px);
    margin-inline: auto;
    padding-inline: var(--space-md);
}

/* Card component with advanced CSS */
.card {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
    box-shadow: 
        0 1px 3px var(--shadow-color),
        0 1px 2px var(--shadow-color);
    transition: 
        transform var(--transition-fast),
        box-shadow var(--transition-fast);
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 
        0 4px 6px var(--shadow-color),
        0 2px 4px var(--shadow-color);
}

/* Button styles with modern CSS features */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    
    padding: var(--space-sm) var(--space-lg);
    font-size: var(--font-size-base);
    font-weight: 500;
    
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    text-decoration: none;
    
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;
}

.btn--primary {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    color: white;
}

.btn--secondary {
    background: transparent;
    color: var(--primary-color);
    border: 2px solid var(--primary-color);
}

.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px var(--shadow-color);
}

/* Ripple effect on buttons */
.btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width var(--transition-fast), height var(--transition-fast);
}

.btn:active::before {
    width: 300px;
    height: 300px;
}

/* Grid layout with CSS Grid */
.grid {
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Flexbox utilities */
.flex {
    display: flex;
    gap: var(--space-md);
}

.flex--center {
    align-items: center;
    justify-content: center;
}

.flex--between {
    justify-content: space-between;
}

/* Animation and keyframes */
@keyframes slideInFromLeft {
    from {
        opacity: 0;
        transform: translateX(-100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

.animate-slide-in {
    animation: slideInFromLeft var(--transition-slow) ease-out;
}

.animate-pulse {
    animation: pulse 2s infinite;
}

/* Modern form styles */
.form-group {
    margin-bottom: var(--space-lg);
}

.form-label {
    display: block;
    margin-bottom: var(--space-xs);
    font-weight: 500;
    color: var(--text-color);
}

.form-input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
}

/* Media queries for responsive design */
@media (max-width: 768px) {
    :root {
        --font-size-base: 0.875rem;
        --space-md: 0.75rem;
        --space-lg: 1rem;
    }
    
    .grid {
        grid-template-columns: 1fr;
    }
    
    .flex {
        flex-direction: column;
    }
}

@media (max-width: 480px) {
    .container {
        padding-inline: var(--space-sm);
    }
    
    .card {
        padding: var(--space-md);
    }
}

/* CSS features showcase */
.showcase {
    /* CSS custom properties in calc() */
    padding: calc(var(--space-md) * 2);
    
    /* CSS logical properties */
    margin-inline-start: var(--space-lg);
    margin-block-end: var(--space-xl);
    
    /* CSS color functions */
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
    
    /* Modern CSS units */
    width: min(100%, 50ch);
    height: clamp(200px, 50vh, 400px);
    
    /* CSS containment */
    contain: layout style paint;
    
    /* CSS scroll snap */
    scroll-snap-type: x mandatory;
    overflow-x: auto;
}

.showcase-item {
    scroll-snap-align: start;
    min-width: 300px;
}

/* CSS subgrid (where supported) */
@supports (grid-template-rows: subgrid) {
    .subgrid-container {
        display: grid;
        grid-template-rows: subgrid;
    }
}

/* CSS container queries (where supported) */
@container (min-width: 400px) {
    .card {
        padding: var(--space-xl);
    }
}`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/test-files/data.csv': {
                type: 'file',
                content: `name,age,city,occupation,salary,active
John Doe,30,New York,Software Engineer,95000,true
Jane Smith,28,San Francisco,Product Manager,110000,true
Mike Johnson,35,Seattle,DevOps Engineer,85000,true
Sarah Wilson,32,Austin,UX Designer,75000,false
David Brown,29,Boston,Data Scientist,90000,true
Lisa Davis,31,Chicago,Marketing Manager,80000,true
Robert Taylor,38,Denver,Solution Architect,120000,true
Emily Anderson,27,Portland,Frontend Developer,70000,true
James Wilson,33,Miami,Backend Developer,85000,false
Jennifer Lee,30,San Diego,Mobile Developer,78000,true`,
                permissions: '-rw-r--r--',
                modified: new Date()
            },
            '/test-files/README.txt': {
                type: 'file',
                content: `Enhanced File Rendering System - Test Files
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
/rendering/RendererRegistry.js and /rendering/renderers/ directory.`,
                permissions: '-rw-r--r--',
                modified: new Date()
            }
        };
    }

    exists(path) {
        return this.root.hasOwnProperty(path);
    }

    get(path) {
        return this.root[path] || null;
    }

    isDirectory(path) {
        const node = this.get(path);
        return node && node.type === 'directory';
    }

    isFile(path) {
        const node = this.get(path);
        return node && node.type === 'file';
    }

    getChildren(path) {
        const node = this.get(path);
        if (node && node.type === 'directory') {
            return node.children || [];
        }
        return [];
    }

    getContent(path) {
        const node = this.get(path);
        if (node && node.type === 'file') {
            return node.content || '';
        }
        return null;
    }

    resolvePath(currentPath, newPath) {
        if (newPath.startsWith('/')) {
            return this.normalizePath(newPath);
        }

        if (newPath === '..') {
            const parts = currentPath.split('/').filter(p => p);
            parts.pop();
            return parts.length === 0 ? '/' : '/' + parts.join('/');
        }

        if (newPath === '.') {
            return currentPath;
        }

        if (newPath === '~') {
            return '/home';
        }

        const combined = currentPath === '/' 
            ? '/' + newPath 
            : currentPath + '/' + newPath;
        
        return this.normalizePath(combined);
    }

    normalizePath(path) {
        const parts = path.split('/').filter(p => p && p !== '.');
        const normalized = [];
        
        for (const part of parts) {
            if (part === '..') {
                normalized.pop();
            } else {
                normalized.push(part);
            }
        }
        
        return '/' + normalized.join('/') || '/';
    }

    getPathCompletions(partial, currentPath) {
        const children = this.getChildren(currentPath);
        return children.filter(child => child.startsWith(partial));
    }

    formatListing(path, detailed = false) {
        const children = this.getChildren(path);
        if (!children.length) return '';

        if (detailed) {
            const lines = ['total ' + children.length];
            for (const child of children) {
                const childPath = path === '/' ? '/' + child : path + '/' + child;
                const node = this.get(childPath);
                if (node) {
                    const date = node.modified.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const size = node.type === 'file' ? (node.content?.length || 0) : 4096;
                    const color = node.type === 'directory' ? '\x1b[34m' : '';
                    const reset = node.type === 'directory' ? '\x1b[0m' : '';
                    lines.push(`${node.permissions} 1 guest guest ${String(size).padStart(6)} ${date} ${color}${child}${reset}`);
                }
            }
            return lines.join('\r\n');
        } else {
            // Format in columns for better readability
            const items = [];
            const maxLength = Math.max(...children.map(c => c.length));
            const columnWidth = maxLength + 2;
            const terminalWidth = 80; // Assume 80 char width
            const columnsPerRow = Math.floor(terminalWidth / columnWidth) || 1;
            
            // Add colors for directories
            const formattedChildren = children.map(child => {
                const childPath = path === '/' ? '/' + child : path + '/' + child;
                const node = this.get(childPath);
                if (node && node.type === 'directory') {
                    return { name: child, display: `\x1b[34m${child}\x1b[0m`, isDir: true };
                }
                return { name: child, display: child, isDir: false };
            });
            
            // Sort: directories first, then files
            formattedChildren.sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
            });
            
            // Build rows
            const rows = [];
            for (let i = 0; i < formattedChildren.length; i += columnsPerRow) {
                const rowItems = formattedChildren.slice(i, i + columnsPerRow);
                const row = rowItems.map(item => 
                    item.display + ' '.repeat(Math.max(0, columnWidth - item.name.length))
                ).join('');
                rows.push(row);
            }
            
            return rows.join('\r\n');
        }
    }
}