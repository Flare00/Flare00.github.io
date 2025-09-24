import { GenericLoader } from "./GenericLoader";

export class TextureLoader {
    private static cache: Map<string, WebGLTexture> = new Map();

    /**
     * Charge une image et crée une WebGL texture (WebGL2RenderingContext attendu)
     * Retourne une promesse qui résout la texture.
     * Utilise GenericLoader pour le fetch et le caching bas-niveau.
     */
    static async loadTexture(gl: WebGL2RenderingContext, url: string, flipY: boolean = true, generateMipmap: boolean = true): Promise<WebGLTexture | null> {
        if (this.cache.has(url)) return this.cache.get(url)!;

        const res = await GenericLoader.loadResource(url);
        if (!res) {
            console.error(`Failed to load texture: ${url}`);
            return null;
        }

        let img: HTMLImageElement | null = null;

        if (res.type === 'image') {
            img = res.data;
        } else if (res.type === 'arraybuffer') {
            // Try to create blob URL then load as image
            const blob = new Blob([res.data]);
            const blobUrl = URL.createObjectURL(blob);
            try {
                img = await GenericLoader.loadImage(blobUrl);
            } finally {
                URL.revokeObjectURL(blobUrl);
            }
        } else if (res.type === 'text') {
            // Some servers may return text for images (unlikely), fallback: create blob from text
            const blob = new Blob([res.data]);
            const blobUrl = URL.createObjectURL(blob);
            try {
                img = await GenericLoader.loadImage(blobUrl);
            } finally {
                URL.revokeObjectURL(blobUrl);
            }
        }

        if (!img) throw new Error(`Failed to load image resource: ${url}`);

        const tex = gl.createTexture();
        if (!tex) throw new Error('Impossible de créer la texture WebGL');

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        if (isPowerOf2(img.width) && isPowerOf2(img.height) && generateMipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.bindTexture(gl.TEXTURE_2D, null);

        this.cache.set(url, tex);
        return tex;
    }

    static getCached(url: string): WebGLTexture | undefined {
        return this.cache.get(url);
    }

    static deleteTexture(gl: WebGL2RenderingContext, url: string): void {
        const tex = this.cache.get(url);
        if (tex) {
            gl.deleteTexture(tex);
            this.cache.delete(url);
        }
    }

    static clearCache(gl?: WebGL2RenderingContext): void {
        if (gl) {
            for (const tex of this.cache.values()) gl.deleteTexture(tex);
        }
        this.cache.clear();
    }
}

function isPowerOf2(value: number) {
    return (value & (value - 1)) === 0;
}