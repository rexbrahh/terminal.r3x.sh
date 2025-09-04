/**
 * CRT WebGL Renderer - Handles post-processing effects for terminal
 * Learning WebGL fundamentals through practical implementation
 */

class CRTRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.programs = {};
        this.buffers = {};
        this.textures = {};
        this.uniforms = {};
        
        this.initWebGL();
        this.setupShaders();
        this.setupGeometry();
        this.setupTextures();
        
        console.log('CRT Renderer initialized', {
            canvas: this.canvas,
            webgl: !!this.gl,
            vendor: this.gl?.getParameter(this.gl.VENDOR),
            renderer: this.gl?.getParameter(this.gl.RENDERER)
        });
    }

    initWebGL() {
        // Get WebGL context with fallback
        this.gl = this.canvas.getContext('webgl2') || 
                  this.canvas.getContext('webgl') || 
                  this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported in this browser');
        }

        // Set canvas size to match display size
        this.resize();

        // Basic WebGL setup
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        // Check if canvas size needs updating
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }

    setupShaders() {
        // Vertex shader - creates a full-screen quad
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;

        // Fragment shader - CRT effects implementation
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform sampler2D u_terminal;
            uniform vec2 u_resolution;
            uniform float u_time;
            
            varying vec2 v_texCoord;
            
            // CRT Effect Functions (toned down for readability)
            vec3 applyScanlines(vec3 color, vec2 uv) {
                // Very subtle horizontal scanlines
                float scanline = sin(uv.y * u_resolution.y * 2.0) * 0.05;
                return color * (1.0 - scanline);
            }
            
            vec3 applyPhosphorGlow(vec3 color, vec2 uv) {
                // Minimal green phosphor glow
                vec3 glow = vec3(0.0, 1.0, 0.1); // Subtle green tint
                float glowStrength = length(color) * 0.1;
                return color + glow * glowStrength;
            }
            
            vec2 applyBarrelDistortion(vec2 uv) {
                // Very subtle barrel distortion
                vec2 centered = uv - 0.5;
                float r2 = dot(centered, centered);
                float distortion = 0.02; // Much more subtle
                return uv + centered * distortion * r2;
            }
            
            vec3 applyVignette(vec3 color, vec2 uv) {
                // Gentle edge darkening
                vec2 center = uv - 0.5;
                float vignette = 1.0 - dot(center, center) * 0.3;
                return color * vignette;
            }
            
            vec3 addNoise(vec3 color, vec2 uv) {
                // Very subtle film grain
                float noise = fract(sin(dot(uv + u_time * 0.001, vec2(12.9898, 78.233))) * 43758.5453);
                return color + noise * 0.005;
            }
            
            void main() {
                vec2 uv = v_texCoord;
                
                // Apply barrel distortion first
                uv = applyBarrelDistortion(uv);
                
                // Sample the terminal texture
                vec4 texColor = texture2D(u_terminal, uv);
                vec3 color = texColor.rgb;
                
                // Apply CRT effects in sequence
                color = applyScanlines(color, uv);
                color = applyPhosphorGlow(color, uv);
                color = applyVignette(color, uv);
                color = addNoise(color, uv);
                
                // Minimal color adjustment
                color = pow(color, vec3(0.95)); // Very slight gamma adjustment
                color *= 1.05; // Minimal brightness boost
                
                gl_FragColor = vec4(color, texColor.a);
            }
        `;

        // Create shader program
        this.programs.crt = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        
        // Get attribute and uniform locations
        this.uniforms.crt = {
            terminal: this.gl.getUniformLocation(this.programs.crt, 'u_terminal'),
            resolution: this.gl.getUniformLocation(this.programs.crt, 'u_resolution'),
            time: this.gl.getUniformLocation(this.programs.crt, 'u_time')
        };

        this.attributes = {
            position: this.gl.getAttribLocation(this.programs.crt, 'a_position'),
            texCoord: this.gl.getAttribLocation(this.programs.crt, 'a_texCoord')
        };
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            throw new Error('Could not compile WebGL program: ' + info);
        }

        return program;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            const typeName = type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment';
            throw new Error(`Could not compile ${typeName} shader: ${info}`);
        }

        return shader;
    }

    setupGeometry() {
        // Create a full-screen quad
        // Two triangles covering the entire screen from -1 to 1 in clip space
        const positions = new Float32Array([
            -1, -1,  // bottom left
             1, -1,  // bottom right
            -1,  1,  // top left
             1,  1   // top right
        ]);

        // Texture coordinates (0,0 = top left, 1,1 = bottom right)
        const texCoords = new Float32Array([
            0, 1,  // bottom left
            1, 1,  // bottom right
            0, 0,  // top left
            1, 0   // top right
        ]);

        // Create and bind position buffer
        this.buffers.position = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        // Create and bind texture coordinate buffer
        this.buffers.texCoord = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    }

    setupTextures() {
        // Create texture for terminal content
        this.textures.terminal = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.terminal);
        
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    updateTerminalTexture(imageData) {
        // Update the terminal texture with new image data
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.terminal);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,                    // level
            this.gl.RGBA,         // internal format
            this.gl.RGBA,         // format
            this.gl.UNSIGNED_BYTE, // type
            imageData            // pixel data
        );
    }

    render(time = 0) {
        // Ensure canvas is right size
        this.resize();

        // Clear the canvas
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Use our shader program
        this.gl.useProgram(this.programs.crt);

        // Set up attributes
        this.setupAttributes();

        // Set uniforms
        this.gl.uniform1i(this.uniforms.crt.terminal, 0); // texture unit 0
        this.gl.uniform2f(this.uniforms.crt.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.crt.time, time * 0.001); // convert to seconds

        // Bind terminal texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.terminal);

        // Draw the quad (2 triangles = 4 vertices)
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    setupAttributes() {
        // Bind and enable position attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.vertexAttribPointer(this.attributes.position, 2, this.gl.FLOAT, false, 0, 0);

        // Bind and enable texture coordinate attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoord);
        this.gl.enableVertexAttribArray(this.attributes.texCoord);
        this.gl.vertexAttribPointer(this.attributes.texCoord, 2, this.gl.FLOAT, false, 0, 0);
    }

    // Cleanup method
    destroy() {
        // Clean up WebGL resources
        if (this.gl) {
            Object.values(this.buffers).forEach(buffer => {
                if (buffer) this.gl.deleteBuffer(buffer);
            });
            
            Object.values(this.textures).forEach(texture => {
                if (texture) this.gl.deleteTexture(texture);
            });
            
            Object.values(this.programs).forEach(program => {
                if (program) this.gl.deleteProgram(program);
            });
        }
    }
}

export { CRTRenderer };