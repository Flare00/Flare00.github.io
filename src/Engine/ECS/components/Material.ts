import type { ShaderProgram } from "../../rendering/ShaderProgram";
import type { Component } from "../Component";
import { ResourceManager } from "../../core/ResourceManager";
import { GLContext } from "../../rendering/GLContext";

export class Material implements Component {
  shader: ShaderProgram;
  uniforms: Record<string, any> = {};
  textures: Record<string, string> = {};
  // fallbackColors stores vec4 colors (as [r,g,b,a] numbers 0..1) per sampler uniform name
  fallbackColors: Record<string, [number, number, number, number]> = {};
  // fallbackByType maps semantic type names (e.g. 'albedo','normal','metallic','roughness','ao') to a vec4 color
  fallbackByType: Record<string, [number, number, number, number]> = {};

  constructor(shader: ShaderProgram) {
    this.shader = shader;
  }

  setUniform(name: string, value: any) {
    this.uniforms[name] = value;
  }

  setTextureUniform(name: string, url: string) {
    this.textures[name] = url;
  }

  /**
   * Set a fallback 1x1 color for a sampler uniform. Color is a vec4 in 0..1
   */
  setFallbackTexture(name: string, color: [number, number, number, number]) {
    this.fallbackColors[name] = color;
  }

  /**
   * Set a fallback color by semantic type (e.g. 'albedo','normal','metallic','roughness','ao')
   */
  setFallbackByType(type: string, color: [number, number, number, number]) {
    this.fallbackByType[type] = color;
  }

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
    for (const [name, url] of Object.entries(this.textures)) {
      const tex = ResourceManager.getTexture(url);
      if (tex) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // set the sampler uniform to the unit index
        this.shader.setUniform(name, unit);
        unit++;
      } else {
        // trigger async load but do not await
        ResourceManager.loadTexture(url, gl).catch((e) => console.warn("Texture load failed", url, e));
        // prefer per-uniform fallback, otherwise try a semantic type fallback
        const fb = this.fallbackColors[name] ?? (() => {
          const t = this.inferTypeFromName(name);
          return t ? this.fallbackByType[t] : undefined;
        })();
        if (fb) {
          try {
            const colorTex = ResourceManager.getOrCreateColorTexture(fb, gl);
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
}
