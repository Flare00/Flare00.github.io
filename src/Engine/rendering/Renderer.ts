import type { Scene } from "../core/Scene";
import { Material } from "../ECS/components/Material";
import { Mesh } from "../ECS/components/Mesh";
import { Transform } from "../ECS/components/Transform";

export class Renderer {
  private gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  render(dt : number, scene: Scene) {
    scene.ecs.systems.update(dt, scene.ecs.components);
    if (!scene.mainCamera) { throw new Error("No main camera set in the scene"); }
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    const meshes = scene.ecs.components.getAllOfType(Mesh);

    for (const [entity, mesh] of meshes) {
      const transform = scene.ecs.components.get(entity, Transform);
      const material = scene.ecs.components.get(entity, Material);

      if (!transform || !material) continue;

      // Active shader
      material.shader.use();

      // Uniforms standards
      material.shader.setUniform("u_proj", scene.mainCamera.projectionMatrix);
      material.shader.setUniform("u_view", scene.mainCamera.viewMatrix);
      material.shader.setUniform("u_model", transform.getLocalMatrix());

      // Uniforms custom
      material.applyUniforms();

      // Bind VAO + draw
      if (mesh.vao) {
        this.gl.bindVertexArray(mesh.vao);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, mesh.vertexCount);
        this.gl.bindVertexArray(null);
      }
    }
  }
}
