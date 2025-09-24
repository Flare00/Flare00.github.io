import type { ShaderProgram } from "../../rendering/ShaderProgram";
import type { Component } from "../Component";
import { ResourceManager } from "../../core/ResourceManager";
import { GLContext } from "../../rendering/GLContext";

export class Material implements Component {
  shader: ShaderProgram;
  uniforms: Record<string, any> = {};
  // textures: map uniform name -> url
  textures: Record<string, string> = {};

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
      }
    }
  }
}
