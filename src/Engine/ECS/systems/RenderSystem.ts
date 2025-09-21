import type { Engine } from "../../core/Engine";
import type { Scene } from "../../core/Scene";
import type { ComponentManager } from "../Component";
import { Camera } from "../components/Camera";
import { Material } from "../components/Material";
import { Mesh } from "../components/Mesh";
import { Transform } from "../components/Transform";
import { System } from "../System";

export class RenderSystem extends System {
    private engine: Engine;

    constructor(engine: Engine) {
        super();
        this.engine = engine;
    }

    update(dt: number, components: ComponentManager): void {
        if (!this.engine.scene) return;
        const cameraEntity = this.engine.scene.getActiveCamera();
        if (!cameraEntity) { throw new Error("No active camera in the scene"); }
        this.engine.glContext.clear(0, 0, 0, 1);

        const camera = components.get(cameraEntity, Camera)!;
        const camTransform = components.get(cameraEntity, Transform)!;
        const meshes = components.getAllOfType(Mesh);

        const viewMatrix = camTransform.getViewMatrix();
        const projMatrix = camera.getProjectionMatrix(this.engine.glContext.getAspectRatio());

        for (const [entity, mesh] of meshes) {
            const transform = components.get(entity, Transform);
            const material = components.get(entity, Material);

            if (!transform || !material) continue;

            // TODO : Grouper les mesh par shader + material pour minimiser les changements d'état 
            // Active shader
            material.shader.use();

            // Uniforms standards
            material.shader.setUniform("u_proj", projMatrix);
            material.shader.setUniform("u_view", viewMatrix);
            material.shader.setUniform("u_model", transform.getLocalMatrix());

            // Uniforms custom
            material.applyUniforms();

            // Bind VAO + draw
            if (mesh.getVAO()) {
                this.engine.glContext.gl.bindVertexArray(mesh.getVAO());
                this.engine.glContext.gl.drawElements(this.engine.glContext.gl.TRIANGLES, mesh.getVertexCount(), this.engine.glContext.gl.UNSIGNED_SHORT, 0);
                this.engine.glContext.gl.bindVertexArray(null);
            }
        }
    }
}