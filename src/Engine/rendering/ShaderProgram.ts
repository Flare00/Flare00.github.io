import type { ShaderData } from "../loaders/ShaderLoader";

export class ShaderProgram {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private uniformLocations: Map<string, WebGLUniformLocation> = new Map();
    private pendingUniforms: Map<string, any> = new Map();
    private dirtyUniforms: Set<string> = new Set();
    // cache des derniers uniforms envoyés pour éviter les uploads redondants
    private uniformCache: Map<string, any> = new Map();
    // optional attribute bindings to apply before link
    private attribBindings: Map<string, number> = new Map();

    constructor(gl: WebGL2RenderingContext, shader: ShaderData) {
        this.gl = gl;
        const vertexShader = this.compile(gl.VERTEX_SHADER, shader.vertexShader);
        const fragmentShader = this.compile(gl.FRAGMENT_SHADER, shader.fragmentShader);

        const program = gl.createProgram();
        if (!program) throw new Error("Impossible de créer le programme WebGL.");

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // apply attribute bindings if any
        for (const [name, loc] of this.attribBindings.entries()) {
            gl.bindAttribLocation(program, loc, name);
        }

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error("Erreur de linkage du shader: " + info);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        this.program = program;
    }

    /**
     * Bind an attribute name to a specific location before linking.
     * Must be called before creating the program (i.e. before constructor usage is limited,
     * so prefer to set bindings on the ShaderData or call this helper before link logic).
     */
    bindAttrib(name: string, location: number) {
        this.attribBindings.set(name, location);
    }

    use(): void {
        this.gl.useProgram(this.program);
        // Appliquer uniquement les uniforms marqués dirty (optimisation)
        for (const name of Array.from(this.dirtyUniforms)) {
            const value = this.pendingUniforms.get(name);
            if (value !== undefined) {
                this.applyUniform(name, value);
                this.pendingUniforms.delete(name);
            }
            this.dirtyUniforms.delete(name);
        }
    }

    getUniformLocation(name: string): WebGLUniformLocation | null {
        if (this.uniformLocations.has(name)) return this.uniformLocations.get(name)!;

        const loc = this.gl.getUniformLocation(this.program, name);
        // Ne pas throw : certains uniforms peuvent être optimisés par le compilateur GPU et ne pas exister
        if (!loc) {
            // store null to avoid repeated lookups
            this.uniformLocations.set(name, null as any);
            return null;
        }
        this.uniformLocations.set(name, loc);
        return loc;
    }


    /**
     * Stocke la valeur d'un uniform pour une application différée (au prochain use())
     */
    set(name: string, value: number | Int32Array | Float32Array | number[]): void {
        this.pendingUniforms.set(name, value);
        this.dirtyUniforms.add(name);
    }

    /**
     * Applique immédiatement la valeur d'un uniform (le shader doit être actif)
     */
    setUniform(name: string, value: number): void;
    setUniform(name: string, value: Int32Array): void;
    setUniform(name: string, value: Float32Array): void;
    setUniform(name: string, value: number[]): void;
    setUniform(name: string, value: any) {
        this.applyUniform(name, value);
    }

    /**
     * Applique la valeur d'un uniform au shader actif
     */
    private applyUniform(name: string, value: any) {
        const loc = this.getUniformLocation(name);
        if (!loc) {
            // uniform absent/optimisé : on ignore proprement
            // console.debug(`Uniform ${name} not found (skipped)`);
            return;
        }

        // Uniform cache: skip if identical
        const prev = this.uniformCache.get(name);
        if (prev !== undefined) {
            if (typeof prev === 'number' || typeof prev === 'boolean') {
                if (prev === value) return;
            } else if (Array.isArray(prev) || prev instanceof Float32Array || prev instanceof Int32Array) {
                const len = prev.length;
                if ((Array.isArray(value) || value instanceof Float32Array || value instanceof Int32Array) && value.length === len) {
                    let same = true;
                    for (let i = 0; i < len; i++) {
                        if (prev[i] !== value[i]) { same = false; break; }
                    }
                    if (same) return;
                }
            }
        }

        // Handle scalar types (number / boolean)
        if (typeof value === 'number') {
            this.gl.uniform1f(loc, value);
            this.uniformCache.set(name, value);
            return;
        }
        if (typeof value === 'boolean') {
            this.gl.uniform1i(loc, value ? 1 : 0);
            this.uniformCache.set(name, value);
            return;
        }

        // If Int32Array or array of ints
        if (value instanceof Int32Array) {
            switch (value.length) {
                case 1: this.gl.uniform1iv(loc, value); this.uniformCache.set(name, new Int32Array(value)); return;
                case 2: this.gl.uniform2iv(loc, value); this.uniformCache.set(name, new Int32Array(value)); return;
                case 3: this.gl.uniform3iv(loc, value); this.uniformCache.set(name, new Int32Array(value)); return;
                case 4: this.gl.uniform4iv(loc, value); this.uniformCache.set(name, new Int32Array(value)); return;
            }
        }

        const len = Array.isArray(value) ? value.length : (value instanceof Float32Array ? value.length : 0);
        if (len > 0) {
            if (value instanceof Float32Array || Array.isArray(value)) {
                switch (len) {
                    case 1: this.gl.uniform1fv(loc, value as any); this.uniformCache.set(name, new Float32Array(value as any)); return;
                    case 2: this.gl.uniform2fv(loc, value as any); this.uniformCache.set(name, new Float32Array(value as any)); return;
                    case 3: this.gl.uniform3fv(loc, value as any); this.uniformCache.set(name, new Float32Array(value as any)); return;
                    case 4: this.gl.uniform4fv(loc, value as any); this.uniformCache.set(name, new Float32Array(value as any)); return;
                    case 9: this.gl.uniformMatrix3fv(loc, false, value as any); this.uniformCache.set(name, new Float32Array(value as any)); return;
                    case 16: this.gl.uniformMatrix4fv(loc, false, value as any); this.uniformCache.set(name, new Float32Array(value as any)); return;
                    default:
                        // fallback: try to upload as float vector
                        this.gl.uniform1fv(loc, new Float32Array(value));
                        this.uniformCache.set(name, new Float32Array(value));
                        return;
                }
            }
        }

        console.warn(`Cannot set uniform '${name}' with value:`, value);
    }

    private compile(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) throw new Error("Cannot create shader.");

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            throw new Error("Shader compilation error: " + info);
        }

        return shader;
    }

    delete(): void {
        this.gl.deleteProgram(this.program);
        this.uniformCache.clear();
        this.uniformLocations.clear();
    }

    /**
     * Clear the cached uniform values (force next set to upload)
     */
    clearUniformCache(): void {
        this.uniformCache.clear();
    }

    getProgram(): WebGLProgram {
        return this.program;
    }
}
