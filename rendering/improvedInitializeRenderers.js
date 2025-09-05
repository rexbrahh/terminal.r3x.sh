import { RendererRegistry } from './RendererRegistry.js';

// Import improved renderers
import { ImprovedMarkdownRenderer } from './renderers/ImprovedMarkdownRenderer.js';
import { ImprovedCSVRenderer } from './renderers/ImprovedCSVRenderer.js';

// Import existing renderers we'll keep
import { TextRenderer } from './renderers/TextRenderer.js';
import { ImageRenderer } from './renderers/ImageRenderer.js';
import { JSONRenderer } from './renderers/JSONRenderer.js';
import { CodeRenderer } from './renderers/CodeRenderer.js';
import { BinaryRenderer } from './renderers/BinaryRenderer.js';
import { YAMLRenderer } from './renderers/YAMLRenderer.js';
import { ArchiveRenderer } from './renderers/ArchiveRenderer.js';
import { HTMLRenderer } from './renderers/HTMLRenderer.js';

/**
 * Initialize and register all improved renderers
 * @returns {RendererRegistry} Configured renderer registry
 */
export function initializeImprovedRenderers() {
    const registry = new RendererRegistry();
    
    // Set default options optimized for terminal display
    registry.setDefaultOptions({
        maxWidth: 80,
        colorOutput: true,
        interactive: false,
        showMetadata: false,
        maxFileSize: 2 * 1024 * 1024 // 2MB limit
    });
    
    // Register improved renderers with higher priority
    registry.register(new ImprovedMarkdownRenderer(), 'markdown');
    registry.register(new ImprovedCSVRenderer(), ['csv', 'tsv']);
    
    // Register existing renderers (will be replaced with improved versions later)
    registry.register(new TextRenderer(), ['text', 'log', 'txt']);
    registry.register(new JSONRenderer(), 'json');
    registry.register(new YAMLRenderer(), ['yaml', 'yml']);
    registry.register(new HTMLRenderer(), ['html', 'htm', 'xhtml']);
    registry.register(new ArchiveRenderer(), ['zip', 'archive', 'jar', 'war', 'ear']);
    registry.register(new ImageRenderer(), 'image');
    registry.register(new BinaryRenderer(), 'binary');
    
    // Register code renderer for programming languages
    const codeTypes = [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
        'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
        'scala', 'bash', 'powershell', 'css', 'scss', 'sass', 'less',
        'xml', 'toml', 'ini', 'config'
    ];
    registry.register(new CodeRenderer(), codeTypes);
    
    // Log registry statistics
    const stats = registry.getStats();
    console.log('Improved Renderer Registry initialized:', {
        totalRenderers: stats.totalRenderers,
        fileTypesSupported: stats.fileTypesSupported,
        improved: ['markdown', 'csv', 'tsv']
    });
    
    return registry;
}

/**
 * Get a pre-configured improved renderer registry singleton
 */
let improvedRegistry = null;

export function getImprovedRendererRegistry() {
    if (!improvedRegistry) {
        improvedRegistry = initializeImprovedRenderers();
    }
    return improvedRegistry;
}