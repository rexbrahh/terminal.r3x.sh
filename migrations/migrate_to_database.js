/**
 * Migration script to populate site_content table from existing filesystem.js content
 * Run this once to migrate from static to database-driven filesystem
 */

import { FileSystem } from '../filesystem.js';
import { SupabaseAPI } from '../api/supabase.js';

class ContentMigrator {
    constructor() {
        this.api = new SupabaseAPI();
        this.fs = new FileSystem();
        this.migrated = [];
    }

    async migrate() {
        console.log('🚀 Starting content migration to database...');
        
        try {
            // Clear existing data
            await this.clearExistingData();
            
            // Migrate all content
            await this.migrateDirectory('/', null);
            
            console.log('✅ Migration completed successfully!');
            console.log(`📊 Migrated ${this.migrated.length} items:`);
            this.migrated.forEach(item => {
                const icon = item.type === 'directory' ? '📁' : '📄';
                console.log(`  ${icon} ${item.path}`);
            });
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    async clearExistingData() {
        console.log('🗑️ Clearing existing site_content data...');
        const { error } = await this.api.supabase
            .from('site_content')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
        
        if (error) throw error;
        console.log('✅ Existing data cleared');
    }

    async migrateDirectory(path, parentPath) {
        console.log(`📂 Processing directory: ${path}`);
        
        // Create directory entry
        if (path !== '/') {
            await this.createDirectoryEntry(path, parentPath);
        }

        // Get children and process them
        const children = this.fs.getChildren(path);
        
        for (const child of children) {
            const childPath = path === '/' ? `/${child}` : `${path}/${child}`;
            
            if (this.fs.isDirectory(childPath)) {
                await this.migrateDirectory(childPath, path === '/' ? null : path);
            } else {
                await this.migrateFile(childPath, path === '/' ? null : path);
            }
        }
    }

    async createDirectoryEntry(path, parentPath) {
        const title = this.getDirectoryTitle(path);
        
        const entry = {
            path: path,
            type: 'directory',
            title: title,
            parent_path: parentPath,
            published: true,
            sort_order: this.getSortOrder(path)
        };

        const { error } = await this.api.supabase
            .from('site_content')
            .insert([entry]);

        if (error) throw error;
        
        this.migrated.push(entry);
        console.log(`  ✅ Created directory: ${path}`);
    }

    async migrateFile(path, parentPath) {
        const content = await this.fs.getContent(path);
        const title = this.getFileTitle(path, content);
        const mimeType = this.getMimeType(path);
        
        const entry = {
            path: path,
            type: 'file',
            title: title,
            content: content,
            parent_path: parentPath,
            mime_type: mimeType,
            published: true,
            sort_order: this.getSortOrder(path)
        };

        const { error } = await this.api.supabase
            .from('site_content')
            .insert([entry]);

        if (error) throw error;
        
        this.migrated.push(entry);
        console.log(`  ✅ Created file: ${path}`);
    }

    getDirectoryTitle(path) {
        const name = path.split('/').pop();
        const titles = {
            'home': 'Home',
            'blogs': 'Blog Posts',
            'projects': 'Projects',
            'now': 'What I\'m doing now'
        };
        return titles[name] || name.charAt(0).toUpperCase() + name.slice(1);
    }

    getFileTitle(path, content) {
        const filename = path.split('/').pop();
        
        // Try to extract title from markdown content
        if (content) {
            const titleMatch = content.match(/^#\s+(.+)$/m);
            if (titleMatch) {
                return titleMatch[1];
            }
        }
        
        // Fallback to filename without extension
        return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }

    getMimeType(path) {
        if (path.endsWith('.md')) return 'text/markdown';
        if (path.endsWith('.txt')) return 'text/plain';
        if (path.endsWith('.json')) return 'application/json';
        return 'text/plain';
    }

    getSortOrder(path) {
        const orderMap = {
            '/home': 1,
            '/blogs': 2,
            '/projects': 3,
            '/now': 4,
            '/about.md': 5
        };
        
        return orderMap[path] || 999;
    }
}

// Export for use in browser console or Node.js environment
if (typeof window !== 'undefined') {
    // Browser environment
    window.ContentMigrator = ContentMigrator;
    console.log('📋 ContentMigrator available in browser console');
    console.log('Run: new ContentMigrator().migrate()');
} else {
    // Node.js environment (if needed)
    export { ContentMigrator };
}