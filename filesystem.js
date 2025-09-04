export class FileSystem {
    constructor() {
        this.root = {
            '/': {
                type: 'directory',
                children: ['home', 'blogs', 'projects', 'now', 'about.md'],
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