import type { ShaderData } from "../loaders/ShaderLoader";

export class ShaderProgram {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private uniformLocations: Map<string, WebGLUniformLocation> = new Map();
    private pendingUniforms: Map<string, any> = new Map();
    private dirtyUniforms: Set<string> = new Set();

    constructor(gl: WebGL2RenderingContext, shader: ShaderData) {
        this.gl = gl;
        const vertexShader = this.compile(gl.VERTEX_SHADER, shader.vertexShader);
        const fragmentShader = this.compile(gl.FRAGMENT_SHADER, shader.fragmentShader);

        const program = gl.createProgram();
        if (!program) throw new Error("Impossible de créer le programme WebGL.");

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error("Erreur de linkage du shader: " + info);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        this.program = program;
    }

    use(): void {
        this.gl.useProgram(this.program);
        // Appliquer tous les uniforms "dirty" (ou tous si on veut forcer)
        for (const [name, value] of this.pendingUniforms.entries()) {
            this.applyUniform(name, value);
        }
        this.dirtyUniforms.clear();
    }

    getUniformLocation(name: string): WebGLUniformLocation {
        if (this.uniformLocations.has(name)) return this.uniformLocations.get(name)!;

        const loc = this.gl.getUniformLocation(this.program, name);
        if (!loc) throw new Error(`Uniform "${name}" introuvable dans le shader.`);
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
        // Map longueur du tableau -> fonction WebGL
        const map: Record<number, (loc: WebGLUniformLocation, v: any) => void> = {
            1: (l, v) => typeof v === "number" ? this.gl.uniform1f(l, v) : this.gl.uniform1iv(l, v),
            2: (l, v) => this.gl.uniform2fv(l, v),
            3: (l, v) => this.gl.uniform3fv(l, v),
            4: (l, v) => Array.isArray(v) || v instanceof Float32Array ? this.gl.uniform4fv(l, v) : this.gl.uniformMatrix2fv(l, false, v),
            9: (l, v) => this.gl.uniformMatrix3fv(l, false, v),
            16: (l, v) => this.gl.uniformMatrix4fv(l, false, v),
        };
        const length = typeof value === "number" ? 1 : value.length;
        map[length](loc, value);
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
    }
}
