import type { ShaderProgram } from "../../rendering/ShaderProgram";
import type { Component } from "../Component";

export class Material implements Component {
  shader: ShaderProgram;
  uniforms: Record<string, any> = {};

  constructor(shader: ShaderProgram) {
    this.shader = shader;
  }

  setUniform(name: string, value: any) {
    this.uniforms[name] = value;
  }

  applyUniforms() {
    for (const [name, value] of Object.entries(this.uniforms)) {
      this.shader.setUniform(name, value);
    }
  }
}
