import { TextureLoader } from "../loaders/TextureLoader";
import { ShaderLoader } from "../loaders/ShaderLoader";
import type { ShaderData } from "../loaders/ShaderLoader";
import { ShaderProgram } from "../rendering/ShaderProgram";
import { GLContext } from "../rendering/GLContext";
import { Engine } from "./Engine";
import { Vec4 } from "ts-gl-matrix";

export class ResourceManager {
    private static texturePromises: Map<string, Promise<WebGLTexture | null>> = new Map();
    private static textureCache: Map<string, WebGLTexture> = new Map();
    // track last used timestamps for color textures (keys starting with __color_)
    private static colorLastUsed: Map<string, number> = new Map();
    private static colorCleanupIntervalId: any = null;

    private static shaderCache: Map<string, ShaderProgram> = new Map();



    static async loadTexture(url: string, gl?: WebGL2RenderingContext | GLContext): Promise<WebGLTexture | null> {
        gl = GLContext.getGL(gl);
        if (!gl) throw new Error("No WebGL context available");

        if (this.textureCache.has(url)) return this.textureCache.get(url)!;
        if (this.texturePromises.has(url)) return this.texturePromises.get(url)!;

        const p = TextureLoader.loadTexture(gl, url).then(tex => {
            if (tex) this.textureCache.set(url, tex);
            this.texturePromises.delete(url);
            return tex;
        });
        this.texturePromises.set(url, p);
        return p;
    }

    static getTexture(url: string): WebGLTexture | undefined {
        return this.textureCache.get(url);
    }

    /**
     * Retourne un handle avec état et possibilités d'écouter les évènements de chargement.
     */
    static loadTextureHandle(url: string, gl?: WebGL2RenderingContext | GLContext) {
        gl = GLContext.getGL(gl);

        type State = 'loading' | 'ready' | 'error';
        const stateObj: { state: State, texture?: WebGLTexture | null, error?: any } = { state: 'loading' };

        const p = this.loadTexture(url, gl).then(tex => {
            stateObj.state = 'ready';
            stateObj.texture = tex ?? null;
            return tex;
        }).catch(e => {
            stateObj.state = 'error';
            stateObj.error = e;
            throw e;
        });

        const listeners: { ready: Array<(t: WebGLTexture | null) => void>, error: Array<(e: any) => void> } = { ready: [], error: [] };
        p.then(tex => { for (const cb of listeners.ready) cb(tex ?? null); }).catch(e => { for (const cb of listeners.error) cb(e); });

        return {
            stateObj,
            promise: p,
            onReady: (cb: (t: WebGLTexture | null) => void) => { listeners.ready.push(cb); if (stateObj.state === 'ready') cb(stateObj.texture ?? null); },
            onError: (cb: (e: any) => void) => { listeners.error.push(cb); if (stateObj.state === 'error' && stateObj.error) cb(stateObj.error); }
        };
    }

    static async loadShaderProgram(folderUrl: string, gl?: WebGL2RenderingContext | GLContext): Promise<ShaderProgram> {
        gl = GLContext.getGL(gl);

        if (this.shaderCache.has(folderUrl)) return this.shaderCache.get(folderUrl)!;
        const data: ShaderData = await ShaderLoader.LoadShaderFolder(folderUrl);

        const program = new ShaderProgram(gl, data);
        this.shaderCache.set(folderUrl, program);
        return program;
    }

    static getShaderProgram(folderUrl: string): ShaderProgram | undefined {
        return this.shaderCache.get(folderUrl);
    }

    static loadShaderProgramHandle(folderUrl: string, gl?: WebGL2RenderingContext | GLContext) {
        gl = GLContext.getGL(gl);

        type State = 'loading' | 'ready' | 'error';
        const stateObj: { state: State, program?: ShaderProgram, error?: any } = { state: 'loading' };

        const p = this.loadShaderProgram(folderUrl, gl).then(prog => {
            stateObj.state = 'ready';
            stateObj.program = prog;
            return prog;
        }).catch(e => {
            stateObj.state = 'error';
            stateObj.error = e;
            throw e;
        });

        const listeners: { ready: Array<(s: ShaderProgram) => void>, error: Array<(e: any) => void> } = { ready: [], error: [] };
        p.then(s => { for (const cb of listeners.ready) cb(s); }).catch(e => { for (const cb of listeners.error) cb(e); });

        return {
            stateObj,
            promise: p,
            onReady: (cb: (s: ShaderProgram) => void) => { listeners.ready.push(cb); if (stateObj.state === 'ready' && stateObj.program) cb(stateObj.program); },
            onError: (cb: (e: any) => void) => { listeners.error.push(cb); if (stateObj.state === 'error' && stateObj.error) cb(stateObj.error); }
        };
    }

    static clearTextures(): void {
        this.texturePromises.clear();
        this.textureCache.clear();
    }

    static clearTexturesGL(gl?: WebGL2RenderingContext | GLContext): void {
        gl = GLContext.getGL(gl);
        for (const tex of this.textureCache.values()) {
            gl.deleteTexture(tex);
        }
        this.clearTextures();
    }

    static deleteTexture(url: string, gl?: WebGL2RenderingContext | GLContext,): void {
        gl = GLContext.getGL(gl);
        const tex = this.textureCache.get(url);
        if (tex) {
            gl.deleteTexture(tex);
            this.textureCache.delete(url);
        }
    }

    static deleteShaderProgram(folderUrl: string): void {
        const p = this.shaderCache.get(folderUrl);
        if (p) {
            p.delete();
            this.shaderCache.delete(folderUrl);
        }
    }

    /**
     * Create or return a cached 1x1 RGBA texture filled with the given color.
     * Color is an array of four numbers in [0,1] representing RGBA.
     */
    static getOrCreateColorTexture(color: Vec4, gl?: WebGL2RenderingContext | GLContext): WebGLTexture {
        gl = GLContext.getGL(gl);
        const key = this.colorKey(color);
        if (this.textureCache.has(key)) return this.textureCache.get(key)!;

        const tex = gl.createTexture();
        if (!tex) throw new Error("Failed to create WebGL texture");
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // convert to Uint8Array
        const r = Math.round(color[0] * 255);
        const g = Math.round(color[1] * 255);
        const b = Math.round(color[2] * 255);
        const a = Math.round(color[3] * 255);
        const pixel = new Uint8Array([r, g, b, a]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

        // set sensible sampling params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.textureCache.set(key, tex);
        // record last used timestamp
        this.colorLastUsed.set(key, Date.now());
        return tex;
    }

    private static colorKey(color: Vec4): string {
        return `__color_${color.map(c => Math.round(c * 255)).join("_")}`;
    }

    /** Delete a previously created color texture (if exists) */
    static deleteColorTexture(color: Vec4, gl?: WebGL2RenderingContext | GLContext): void {
        gl = GLContext.getGL(gl);
        const key = this.colorKey(color);
        const tex = this.textureCache.get(key);
        if (tex) {
            gl.deleteTexture(tex);
            this.textureCache.delete(key);
            this.colorLastUsed.delete(key);
        }
    }

    /**
     * Remove all cached color textures.
     */
    static clearColorTextures(gl?: WebGL2RenderingContext | GLContext): void {
        gl = GLContext.getGL(gl);
        for (const key of Array.from(this.textureCache.keys())) {
            if (key.startsWith('__color_')) {
                const tex = this.textureCache.get(key)!;
                gl.deleteTexture(tex);
                this.textureCache.delete(key);
                this.colorLastUsed.delete(key);
            }
        }
    }

    /**
     * Enable or disable automatic pruning of color textures not used for `staleAfterMs` milliseconds.
     * When enabled, the manager will periodically prune old color textures.
     */
    static enableColorTextureAutoCleanup(enable: boolean, staleAfterMs = 60_000, intervalMs = 30_000) {
        if (enable) {
            if (this.colorCleanupIntervalId !== null) return; // already enabled
            this.colorCleanupIntervalId = setInterval(() => {
                const now = Date.now();
                for (const [key, last] of Array.from(this.colorLastUsed.entries())) {
                    if (now - last > staleAfterMs) {
                        const tex = this.textureCache.get(key);
                        if (tex) {
                            try {
                                const gl = GLContext.getGL();
                                gl.deleteTexture(tex);
                            } catch (e) {
                                // ignore if no global GL
                            }
                        }
                        this.textureCache.delete(key);
                        this.colorLastUsed.delete(key);
                    }
                }
            }, intervalMs);
        } else {
            if (this.colorCleanupIntervalId !== null) {
                clearInterval(this.colorCleanupIntervalId);
                this.colorCleanupIntervalId = null;
            }
        }
    }
}
