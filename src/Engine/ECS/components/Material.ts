import type { ShaderProgram } from "../../rendering/ShaderProgram";
import type { Component } from "../Component";
import { ResourceManager } from "../../core/ResourceManager";
import { GLContext } from "../../rendering/GLContext";
import { Vec4 } from "ts-gl-matrix";

export type TextureEntry = { url: string; fallback: Vec4 };

export class Material implements Component {
  shader: ShaderProgram;
  uniforms: { [key: string]: any } = {};
  // textures now store url and optional fallback color per sampler
  textures: { [key: string]: TextureEntry } = {};

  constructor(shader: ShaderProgram) {
    this.shader = shader;
  }

  setUniform(name: string, value: any) {
    this.uniforms[name] = value;
  }

  setTextureUniform(name: string, url: string) {
    this.textures[name] = { url, fallback: Vec4.fromValues(1, 1, 1, 1) };
  }

  /**
   * Set a fallback 1x1 color for a sampler uniform. Color is a vec4 in 0..1
   */
  setFallback(name: string, color: [number, number, number, number] | Vec4) {
    const vec = Array.isArray(color) ? Vec4.fromValues(...color) : color;
    const texture = this.textures[name] ?? { url: "", fallback: vec };
    this.textures[name] = texture;
  }

  /**
   * Set a fallback color by semantic type (e.g. 'albedo','normal','metallic','roughness','ao')
   */
  // NOTE: fallbackByType removed in favor of per-texture fallback. Keep infer helper for compatibility.

  /**
   * Infer a semantic type from a sampler uniform name.
   */
  private inferTypeFromName(name: string): string | null {
    // normalize: remove common prefix/suffix like 'u_' and '_map'
    let n = name.toLowerCase();
    if (n.startsWith('u_')) n = n.substring(2);
    if (n.endsWith('_map')) n = n.substring(0, n.length - 4);
    if (n.includes('albedo') || n.includes('diffuse')) return 'albedo';
    if (n.includes('normal')) return 'normal';
    if (n.includes('metallic')) return 'metallic';
    if (n.includes('roughness')) return 'roughness';
    if (n.includes('ao')) return 'ao';
    return null;
  }

  /**
   * Applique les uniforms et bind les textures sur le shader actif.
   * Note: si une texture n'est pas encore chargée, elle est ignorée (chargement asynchrone via ResourceManager)
   */
  applyTo(gl?: WebGL2RenderingContext | GLContext) {
    gl = GLContext.getGL(gl);
    // Apply scalar / matrix uniforms
    for (const [name, value] of Object.entries(this.uniforms)) {
      this.shader.setUniform(name, value);
    }

    // Bind textures to successive texture units
    let unit = 0;
    for (const [name, entry] of Object.entries(this.textures)) {
      const url = entry.url;
      const tex = url ? ResourceManager.getTexture(url) : undefined;
      if (tex) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // set the sampler uniform to the unit index
        this.shader.setUniform(name, unit);
        unit++;
      } else {
        // trigger async load if we have a url but do not await
        if (url) ResourceManager.loadTexture(url, gl).catch((e) => console.warn("Texture load failed", url, e));

        if (entry.fallback) {
          try {
            const colorTex = ResourceManager.getOrCreateColorTexture(entry.fallback, gl);
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, colorTex);
            this.shader.setUniform(name, unit);
            unit++;
          } catch (e) {
            console.warn("Failed to create fallback color texture", e);
          }
        }
      }
    }
  }

  static inspector = {
    textures: {
      type: 'textures',
    }
  } as Record<string, any>;
}
