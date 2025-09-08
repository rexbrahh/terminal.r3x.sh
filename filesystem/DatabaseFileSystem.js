/**
 * Database-driven FileSystem - Complete rewrite for dynamic content
 * All content comes from Supabase, no hardcoded files
 */

export class DatabaseFileSystem {
    constructor(api) {
        this.api = api;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        console.log('🗂️ Initializing database-driven filesystem...');
    }

    async initialize() {
        console.log('🔄 Loading filesystem structure from database...');
        try {
            await this.loadStructure();
            console.log('✅ Filesystem loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load filesystem:', error);
            throw error;
        }
    }

    async loadStructure() {
        const { data, error } = await this.api.supabase
            .from('site_content')
            .select('*')
            .eq('published', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        // Clear cache and rebuild
        this.cache.clear();
        
        // Build directory structure
        this.structure = this.buildStructureTree(data || []);
        console.log('📁 Loaded', data?.length || 0, 'items from database');
    }

    buildStructureTree(items) {
        const structure = new Map();
        const directories = new Map();
        
        // First pass: create all items
        items.forEach(item => {
            structure.set(item.path, {
                ...item,
                children: item.type === 'directory' ? [] : null
            });
            
            if (item.type === 'directory') {
                directories.set(item.path, []);
            }
        });
        
        // Second pass: build parent-child relationships
        items.forEach(item => {
            if (item.parent_path && directories.has(item.parent_path)) {
                directories.get(item.parent_path).push(item.path.split('/').pop());
            }
        });
        
        // Update children arrays
        directories.forEach((children, path) => {
            if (structure.has(path)) {
                structure.get(path).children = children.sort();
            }
        });
        
        return structure;
    }

    // Core filesystem operations
    exists(path) {
        path = this.normalizePath(path);
        return this.structure && this.structure.has(path);
    }

    isDirectory(path) {
        path = this.normalizePath(path);
        const item = this.structure?.get(path);
        return item?.type === 'directory';
    }

    isFile(path) {
        path = this.normalizePath(path);
        const item = this.structure?.get(path);
        return item?.type === 'file';
    }

    getChildren(path) {
        path = this.normalizePath(path);
        const item = this.structure?.get(path);
        return item?.children || [];
    }

    async getContent(path) {
        path = this.normalizePath(path);
        const item = this.structure?.get(path);
        
        if (!item || item.type !== 'file') {
            return null;
        }
        
        // Return cached content if available
        const cacheKey = `content:${path}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.content;
        }
        
        // Cache the content
        this.cache.set(cacheKey, {
            content: item.content,
            timestamp: Date.now()
        });
        
        return item.content;
    }

    getMetadata(path) {
        path = this.normalizePath(path);
        const item = this.structure?.get(path);
        
        if (!item) return null;
        
        return {
            type: item.type,
            title: item.title,
            created_at: item.created_at,
            updated_at: item.updated_at,
            mime_type: item.mime_type || 'text/markdown'
        };
    }

    // Lightweight stat for policy checks and tools
    stat(path) {
        path = this.normalizePath(path);
        const item = this.structure?.get(path);
        if (!item) return null;
        const size = typeof item.content === 'string' ? item.content.length : 0;
        return {
            exists: true,
            path,
            isDirectory: item.type === 'directory',
            type: item.type,
            size,
            mime_type: item.mime_type || 'text/plain',
            title: item.title,
            created_at: item.created_at,
            updated_at: item.updated_at,
        };
    }

    // Path utilities
    normalizePath(path) {
        if (!path || path === '.') return '/';
        if (!path.startsWith('/')) path = '/' + path;
        return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    }

    resolvePath(currentPath, targetPath) {
        if (targetPath.startsWith('/')) {
            return this.normalizePath(targetPath);
        }
        
        if (targetPath === '..') {
            const parts = currentPath.split('/').filter(p => p);
            parts.pop();
            return '/' + parts.join('/');
        }
        
        if (targetPath === '.') {
            return currentPath;
        }
        
        const currentParts = currentPath.split('/').filter(p => p);
        const targetParts = targetPath.split('/').filter(p => p);
        
        for (const part of targetParts) {
            if (part === '..') {
                currentParts.pop();
            } else if (part !== '.') {
                currentParts.push(part);
            }
        }
        
        return '/' + currentParts.join('/');
    }

    // Listing and formatting
    formatListing(path, detailed = false) {
        const children = this.getChildren(path);
        if (!children.length) return '';
        
        const lines = [];
        
        for (const child of children) {
            const childPath = path === '/' ? `/${child}` : `${path}/${child}`;
            const item = this.structure.get(childPath);
            
            if (!item) continue;
            
            if (detailed) {
                const permissions = item.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
                const size = item.content ? item.content.length.toString().padStart(8) : '     dir';
                const date = new Date(item.updated_at || item.created_at).toLocaleDateString();
                const name = item.type === 'directory' ? `\x1b[34m${child}\x1b[0m` : child;
                
                lines.push(`${permissions} 1 guest guest ${size} ${date} ${name}`);
            } else {
                const name = item.type === 'directory' ? `\x1b[34m${child}\x1b[0m` : child;
                lines.push(name);
            }
        }
        
        return lines.join('\r\n');
    }

    // Cache management
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Filesystem cache cleared');
    }

    // Refresh from database
    async refresh() {
        console.log('🔄 Refreshing filesystem from database...');
        try {
            await this.loadStructure();
            console.log('✅ Filesystem refreshed');
            return true;
        } catch (error) {
            console.error('❌ Failed to refresh filesystem:', error);
            return false;
        }
    }

    // Debug utilities
    getStats() {
        const totalItems = this.structure ? this.structure.size : 0;
        const directories = Array.from(this.structure?.values() || [])
            .filter(item => item.type === 'directory').length;
        const files = totalItems - directories;
        
        return {
            totalItems,
            directories,
            files,
            cacheSize: this.cache.size
        };
    }

    debugStructure() {
        if (!this.structure) {
            console.log('No structure loaded');
            return;
        }
        
        console.log('📂 Filesystem Structure:');
        for (const [path, item] of this.structure.entries()) {
            const icon = item.type === 'directory' ? '📁' : '📄';
            const children = item.children ? ` (${item.children.length} children)` : '';
            console.log(`  ${icon} ${path}${children}`);
        }
    }
}
