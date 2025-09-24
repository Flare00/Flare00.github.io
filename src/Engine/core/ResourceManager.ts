import { TextureLoader } from "../loaders/TextureLoader";
import { ShaderLoader } from "../loaders/ShaderLoader";
import type { ShaderData } from "../loaders/ShaderLoader";
import { ShaderProgram } from "../rendering/ShaderProgram";
import { GLContext } from "../rendering/GLContext";
import { Engine } from "./Engine";

export class ResourceManager {
    private static texturePromises: Map<string, Promise<WebGLTexture | null>> = new Map();
    private static textureCache: Map<string, WebGLTexture> = new Map();

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
}
