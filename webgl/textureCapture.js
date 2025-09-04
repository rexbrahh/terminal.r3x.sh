/**
 * Texture Capture System - Converts DOM terminal to WebGL texture
 * Key learning concepts: Canvas 2D API, ImageData, texture uploads
 */

class TextureCapture {
    constructor() {
        this.captureCanvas = null;
        this.captureCtx = null;
        this.lastCaptureTime = 0;
        this.captureThrottle = 16; // ~60fps max
        this.isCapturing = false;
        
        this.setupCaptureCanvas();
        
        console.log('Texture Capture initialized');
    }

    setupCaptureCanvas() {
        // Create off-screen canvas for rendering terminal content
        this.captureCanvas = document.createElement('canvas');
        this.captureCtx = this.captureCanvas.getContext('2d');
        
        // Don't add to DOM - this is for texture capture only
        this.captureCanvas.style.display = 'none';
    }

    async captureTerminal(terminalElement) {
        const now = performance.now();
        
        // Throttle captures to avoid performance issues
        if (now - this.lastCaptureTime < this.captureThrottle || this.isCapturing) {
            return null;
        }

        this.isCapturing = true;
        this.lastCaptureTime = now;

        try {
            // Get terminal dimensions
            const rect = terminalElement.getBoundingClientRect();
            const width = Math.floor(rect.width);
            const height = Math.floor(rect.height);

            // Resize capture canvas if needed
            if (this.captureCanvas.width !== width || this.captureCanvas.height !== height) {
                this.captureCanvas.width = width;
                this.captureCanvas.height = height;
            }

            // Method 1: html2canvas (more reliable but slower)
            const canvas = await this.captureWithHtml2Canvas(terminalElement);
            return canvas;

        } catch (error) {
            console.warn('Terminal capture failed:', error);
            return this.createFallbackTexture();
        } finally {
            this.isCapturing = false;
        }
    }

    async captureWithHtml2Canvas(element) {
        // html2canvas converts DOM element to canvas
        const canvas = await html2canvas(element, {
            backgroundColor: null, // Transparent background
            scale: 1,
            logging: false,
            allowTaint: true,
            useCORS: true,
            width: this.captureCanvas.width,
            height: this.captureCanvas.height
        });

        return canvas;
    }

    // Alternative method: Direct canvas drawing (faster but more complex)
    captureWithCanvas2D(terminalElement) {
        // Clear the capture canvas
        this.captureCtx.clearRect(0, 0, this.captureCanvas.width, this.captureCanvas.height);
        
        // Set styles to match terminal
        this.captureCtx.fillStyle = '#0c0c0c'; // Terminal background
        this.captureCtx.fillRect(0, 0, this.captureCanvas.width, this.captureCanvas.height);
        
        // This would require manual text rendering - complex but educational
        // For now, we'll stick with html2canvas
        
        return this.captureCanvas;
    }

    createFallbackTexture() {
        // Create a simple fallback texture when capture fails
        const width = 800;
        const height = 600;
        
        this.captureCanvas.width = width;
        this.captureCanvas.height = height;
        
        // Draw a simple pattern
        this.captureCtx.fillStyle = '#0c0c0c';
        this.captureCtx.fillRect(0, 0, width, height);
        
        this.captureCtx.fillStyle = '#00ff00';
        this.captureCtx.font = '16px monospace';
        this.captureCtx.fillText('WebGL CRT Renderer', 20, 50);
        this.captureCtx.fillText('Fallback texture active', 20, 80);
        
        return this.captureCanvas;
    }

    // Convert canvas to ImageData for WebGL texture upload
    getImageData(canvas) {
        const tempCtx = canvas.getContext('2d');
        return tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    }

    // Utility: Check if terminal content has changed (optimization)
    hasTerminalChanged(terminalElement) {
        // Simple hash-based change detection
        const currentContent = terminalElement.textContent;
        const currentHash = this.hashCode(currentContent);
        
        if (currentHash !== this.lastContentHash) {
            this.lastContentHash = currentHash;
            return true;
        }
        
        return false;
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    // Performance monitoring
    getStats() {
        return {
            lastCaptureTime: this.lastCaptureTime,
            isCapturing: this.isCapturing,
            captureThrottle: this.captureThrottle,
            canvasSize: {
                width: this.captureCanvas.width,
                height: this.captureCanvas.height
            }
        };
    }

    // Cleanup
    destroy() {
        if (this.captureCanvas) {
            this.captureCanvas.remove();
            this.captureCanvas = null;
            this.captureCtx = null;
        }
    }
}

export { TextureCapture };