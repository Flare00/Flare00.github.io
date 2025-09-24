/* GenericLoader.ts
 * Utilitaire pour charger des fichiers génériques.
 * - expose fetchArrayBuffer, fetchText, loadImage
 * - expose loadResource(url, hint?) qui détecte par extension et renvoie un objet { type, data, mime }
 *
 * Usage recommandé :
 * - Utiliser GenericLoader pour faire les fetchs bas-niveau et le caching global.
 * - Garder des loaders spécialisés (TextureLoader, ModelLoader) pour parser/transformer les données.
 */

export type LoadedResource =
    | { type: 'arraybuffer'; data: ArrayBuffer; mime?: string }
    | { type: 'text'; data: string; mime?: string }
    | { type: 'image'; data: HTMLImageElement; mime?: string };

export class GenericLoader {
    private static cache = new Map<string, LoadedResource>();

    static async fetchArrayBuffer(url: string, init?: RequestInit): Promise<ArrayBuffer> {
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
        return await res.arrayBuffer();
    }

    static async fetchText(url: string, init?: RequestInit): Promise<string> {
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
        return await res.text();
    }

    static loadImage(url: string, crossOrigin: string | null = 'anonymous'): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            if (crossOrigin) img.crossOrigin = crossOrigin;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    /**
     * Try to detect resource type by extension or content-type hint and load accordingly.
     * Returns a simple discriminated union with { type, data, mime }.
     * Keep this function thin: parsing (OBJ, glTF, etc.) should stay in specialised loaders.
     */
    static async loadResource(url: string, hintMime?: string): Promise<LoadedResource | null> {
        // Return cached if present
        const cached = this.cache.get(url);
        if (cached) return cached;

        const ext = this._getExtension(url).toLowerCase();
        const mime = hintMime || this._mimeFromExtension(ext) || undefined;

        let result: LoadedResource;

        try {

            if (mime && mime.startsWith('image/')) {
                const img = await this.loadImage(url);
                result = { type: 'image', data: img, mime };
            } else if (ext === 'obj' || ext === 'mtl' || ext === 'gltf' || ext === 'glsl' || ext === 'vs' || ext === 'fs' || ext === 'txt' || ext === 'json') {
                // treat as text
                const text = await this.fetchText(url);
                result = { type: 'text', data: text, mime };
            } else if (ext === 'glb' || ext === 'bin' || ext === 'fbx' || ext === 'dae' || ext === 'stl') {
                // binary formats
                const ab = await this.fetchArrayBuffer(url);
                result = { type: 'arraybuffer', data: ab, mime };
            } else {
                // Fallback: try HEAD then decide, but fetch as arrayBuffer by default because it's safe.
                // Simpler approach: fetch arrayBuffer and let caller decide.
                const ab = await this.fetchArrayBuffer(url);
                result = { type: 'arraybuffer', data: ab, mime };
            }
        }
        catch (e) {
            console.error(`Failed to load resource ${url}: ${(e as Error).message}`);
            return null;
        }
        this.cache.set(url, result);
        return result;
    }

    static loadedResourceToText(loaded : LoadedResource | null = null): string | null {
        if (!loaded) return null;
        if (loaded.type === 'text') {
            return loaded.data;
        } else if (loaded.type === 'arraybuffer') {
            const decoder = new TextDecoder();
            return decoder.decode(loaded.data);
        } else if (loaded.type === 'image') {
            console.error("Cannot convert image resource to text");
        }
        return "";
    }

    static getCached(url: string): LoadedResource | undefined {
        return this.cache.get(url);
    }

    static clearCache(): void {
        this.cache.clear();
    }

    private static _getExtension(url: string): string {
        try {
            const u = new URL(url, location.href);
            const p = u.pathname;
            const idx = p.lastIndexOf('.');
            if (idx >= 0) return p.substring(idx + 1);
            return '';
        } catch (e) {
            const idx = url.lastIndexOf('.');
            if (idx >= 0) return url.substring(idx + 1);
            return '';
        }
    }

    private static _mimeFromExtension(ext: string): string | null {
        switch (ext) {
            case 'png': return 'image/png';
            case 'jpg':
            case 'jpeg': return 'image/jpeg';
            case 'gif': return 'image/gif';
            case 'webp': return 'image/webp';
            case 'bmp': return 'image/bmp';
            case 'obj': return 'text/plain';
            case 'gltf': return 'application/json';
            case 'glb': return 'model/gltf-binary';
            case 'bin': return 'application/octet-stream';
            case 'fbx': return 'application/octet-stream';
            case 'stl': return 'application/sla';
            case 'vs':
            case 'fs':
            case 'glsl': return 'text/plain';
            case 'json': return 'application/json';
            case 'txt': return 'text/plain';
            default: return null;
        }
    }
}
