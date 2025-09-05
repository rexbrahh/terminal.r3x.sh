import { SupabaseAPI } from './api/supabase.js';

// Sample files content
const sampleFiles = [
    {
        path: '/samples',
        type: 'directory',
        title: 'Sample Files',
        content: null,
        parent_path: '/',
        mime_type: null,
        sort_order: 500
    },
    {
        path: '/samples/test.csv',
        type: 'file',
        title: 'Sample CSV Data',
        content: `Name,Age,Department,Salary,Start Date
John Smith,32,Engineering,95000,2020-03-15
Jane Doe,28,Marketing,75000,2021-06-01
Bob Johnson,45,Sales,85000,2018-11-20
Alice Williams,36,HR,70000,2019-09-10
Charlie Brown,29,Engineering,90000,2022-01-15
Diana Prince,41,Management,120000,2017-04-05
Eve Anderson,33,Finance,80000,2020-08-12
Frank Miller,38,Engineering,100000,2019-02-28
Grace Lee,26,Marketing,65000,2023-03-01
Henry Wilson,52,Management,150000,2015-06-15`,
        parent_path: '/samples',
        mime_type: 'text/csv',
        sort_order: 1
    },
    {
        path: '/samples/config.yaml',
        type: 'file',
        title: 'Sample YAML Config',
        content: `application:
  name: terminal.r3x.sh
  version: 2.0.0
  description: Enhanced terminal web interface

server:
  host: localhost
  port: 8000
  secure: false
  cors:
    enabled: true
    origins:
      - http://localhost:3000
      - https://r3x.sh

database:
  provider: supabase
  connection:
    url: https://api.supabase.io
    anon_key: \${SUPABASE_ANON_KEY}
    service_role: \${SUPABASE_SERVICE_ROLE}
  
features:
  - markdown_rendering
  - syntax_highlighting
  - csv_tables
  - yaml_parsing
  - archive_viewing
  
rendering:
  max_width: 80
  color_output: true
  themes:
    default:
      background: "#0c0c0c"
      foreground: "#00ff00"
      cursor: "#00ff00"
    
build:
  minify: false
  source_maps: true
  target: es2020`,
        parent_path: '/samples',
        mime_type: 'text/yaml',
        sort_order: 2
    },
    {
        path: '/samples/test.html',
        type: 'file',
        title: 'Sample HTML Page',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Test HTML file for terminal rendering">
    <title>Terminal Web Renderer Test</title>
</head>
<body>
    <h1>Welcome to Terminal Web</h1>
    
    <p>This is a <strong>test document</strong> to demonstrate HTML to terminal conversion.</p>
    
    <h2>Features</h2>
    <ul>
        <li>Converts HTML structure to terminal text</li>
        <li>Preserves headings and formatting</li>
        <li>Handles lists and tables</li>
        <li>Shows links in terminal-friendly format</li>
    </ul>
    
    <h3>Code Example</h3>
    <pre><code>
function hello() {
    console.log("Hello from terminal!");
}
    </code></pre>
    
    <h3>Sample Table</h3>
    <table>
        <tr>
            <th>Feature</th>
            <th>Status</th>
            <th>Version</th>
        </tr>
        <tr>
            <td>Markdown</td>
            <td>Complete</td>
            <td>2.0</td>
        </tr>
        <tr>
            <td>CSV</td>
            <td>Complete</td>
            <td>2.0</td>
        </tr>
        <tr>
            <td>YAML</td>
            <td>Complete</td>
            <td>2.0</td>
        </tr>
    </table>
    
    <blockquote>
        "The terminal is not just a tool, it's a way of life."
    </blockquote>
    
    <p>Visit our website at <a href="https://terminal.r3x.sh">terminal.r3x.sh</a> for more information.</p>
    
    <hr>
    
    <p><em>Copyright 2025 - Terminal Web Project</em></p>
</body>
</html>`,
        parent_path: '/samples',
        mime_type: 'text/html',
        sort_order: 3
    },
    {
        path: '/samples/code.js',
        type: 'file',
        title: 'JavaScript Example',
        content: `// Example JavaScript file to test syntax highlighting
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

class TerminalEmulator {
    constructor(container) {
        this.terminal = new Terminal({
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#ffffff'
            },
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, monospace'
        });
        
        this.fitAddon = new FitAddon();
        this.terminal.loadAddon(this.fitAddon);
    }
    
    async initialize() {
        // Initialize the terminal
        this.terminal.open(document.getElementById('terminal'));
        this.fitAddon.fit();
        
        // Set up event handlers
        this.terminal.onData(data => {
            this.handleInput(data);
        });
        
        // Display welcome message
        this.terminal.writeln('Welcome to Terminal Emulator v1.0');
        this.terminal.writeln('Type "help" for available commands');
        this.prompt();
    }
    
    handleInput(data) {
        switch(data) {
            case '\\r': // Enter key
                this.executeCommand();
                break;
            case '\\u007F': // Backspace
                this.handleBackspace();
                break;
            default:
                this.terminal.write(data);
                this.currentInput += data;
        }
    }
    
    prompt() {
        this.terminal.write('\\r\\n$ ');
        this.currentInput = '';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const term = new TerminalEmulator();
    term.initialize();
});`,
        parent_path: '/samples',
        mime_type: 'application/javascript',
        sort_order: 4
    },
    {
        path: '/samples/data.json',
        type: 'file',
        title: 'Sample JSON Data',
        content: `{
  "project": {
    "name": "terminal.r3x.sh",
    "version": "2.0.0",
    "description": "A Unix-like terminal interface for web browsing",
    "author": {
      "name": "Rex Liu",
      "email": "rex@r3x.sh",
      "github": "https://github.com/rexliu"
    },
    "features": [
      {
        "name": "File Rendering",
        "status": "complete",
        "components": [
          "Markdown Parser",
          "CSV/TSV Tables",
          "YAML Viewer",
          "HTML Converter",
          "Syntax Highlighter"
        ]
      },
      {
        "name": "Terminal Commands",
        "status": "complete",
        "commands": ["ls", "cd", "cat", "pwd", "clear", "help", "start"]
      },
      {
        "name": "Database Integration",
        "status": "complete",
        "provider": "Supabase",
        "features": ["Dynamic content", "Real-time updates", "Caching"]
      }
    ],
    "statistics": {
      "files": 127,
      "commands": 7,
      "renderers": 11,
      "libraries": 6
    },
    "metadata": {
      "created": "2024-12-01",
      "updated": "2025-01-05",
      "license": "MIT"
    }
  }
}`,
        parent_path: '/samples',
        mime_type: 'application/json',
        sort_order: 5
    }
];

async function addSampleFiles() {
    const api = new SupabaseAPI();
    
    console.log('Adding sample files to database...');
    
    for (const file of sampleFiles) {
        try {
            // Check if file already exists
            const { data: existing } = await api.client
                .from('site_content')
                .select('id')
                .eq('path', file.path)
                .single();
            
            if (existing) {
                // Update existing file
                const { error } = await api.client
                    .from('site_content')
                    .update(file)
                    .eq('path', file.path);
                
                if (error) {
                    console.error(`Error updating ${file.path}:`, error);
                } else {
                    console.log(`Updated: ${file.path}`);
                }
            } else {
                // Insert new file
                const { error } = await api.client
                    .from('site_content')
                    .insert(file);
                
                if (error) {
                    console.error(`Error inserting ${file.path}:`, error);
                } else {
                    console.log(`Added: ${file.path}`);
                }
            }
        } catch (error) {
            console.error(`Error processing ${file.path}:`, error);
        }
    }
    
    console.log('Sample files added successfully!');
    console.log('Refresh your terminal and try:');
    console.log('  cd samples');
    console.log('  ls');
    console.log('  cat test.csv');
    console.log('  cat config.yaml');
    console.log('  cat test.html');
    console.log('  cat code.js');
    console.log('  cat data.json');
}

// Run the script
addSampleFiles().catch(console.error);