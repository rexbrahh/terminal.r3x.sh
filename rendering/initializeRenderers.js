import { RendererRegistry } from './RendererRegistry.js';
import { MarkdownRenderer } from './renderers/MarkdownRenderer.js';
import { EnhancedMarkdownRenderer } from './renderers/EnhancedMarkdownRenderer.js';
import { TextRenderer } from './renderers/TextRenderer.js';
import { ImageRenderer } from './renderers/ImageRenderer.js';
import { JSONRenderer } from './renderers/JSONRenderer.js';
import { CodeRenderer } from './renderers/CodeRenderer.js';
import { BinaryRenderer } from './renderers/BinaryRenderer.js';
import { CSVRenderer } from './renderers/CSVRenderer.js';
import { YAMLRenderer } from './renderers/YAMLRenderer.js';
import { ArchiveRenderer } from './renderers/ArchiveRenderer.js';
import { HTMLRenderer } from './renderers/HTMLRenderer.js';

/**
 * Initialize and register all available renderers
 * @returns {RendererRegistry} Configured renderer registry
 */
export function initializeRenderers() {
    const registry = new RendererRegistry();
    
    // Set default options for all renderers
    registry.setDefaultOptions({
        maxWidth: 80,
        colorOutput: true,
        interactive: false,
        showMetadata: false
    });
    
    // Register text-based renderers
    registry.register(new TextRenderer(), ['text', 'log', 'txt']);
    
    // Register markdown renderers (Enhanced has higher priority)
    registry.register(new MarkdownRenderer(), 'markdown');
    if (typeof marked !== 'undefined') {
        registry.register(new EnhancedMarkdownRenderer(), 'markdown');
    }
    
    // Register code renderer for all code file types
    const codeTypes = [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
        'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
        'scala', 'bash', 'powershell', 'css', 'scss', 'sass', 'less',
        'xml', 'toml', 'ini', 'config'
    ];
    const codeRenderer = new CodeRenderer();
    registry.register(codeRenderer, codeTypes);
    
    // Register data format renderers
    registry.register(new JSONRenderer(), 'json');
    registry.register(new CSVRenderer(), ['csv', 'tsv']);
    registry.register(new YAMLRenderer(), ['yaml', 'yml']);
    
    // Register HTML renderer
    registry.register(new HTMLRenderer(), ['html', 'htm', 'xhtml']);
    
    // Register archive renderer
    registry.register(new ArchiveRenderer(), ['zip', 'archive', 'jar', 'war', 'ear']);
    
    // Register image renderer
    registry.register(new ImageRenderer(), 'image');
    
    // Register binary renderer (fallback for unknown binary files)
    registry.register(new BinaryRenderer(), 'binary');
    
    // Log registration stats
    const stats = registry.getStats();
    console.log('Renderer Registry initialized:', stats);
    
    return registry;
}

/**
 * Get a pre-configured renderer registry singleton
 */
let sharedRegistry = null;

export function getRendererRegistry() {
    if (!sharedRegistry) {
        sharedRegistry = initializeRenderers();
    }
    return sharedRegistry;
}