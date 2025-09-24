import type { Engine } from "../../core/Engine";
import type { Scene } from "../../core/Scene";
import type { ComponentManager } from "../Component";
import { Camera } from "../components/Camera";
import { Material } from "../components/Material";
import { MaterialManager } from "../../core/MaterialManager";
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

        // Batching: regrouper par signature de matériau (shader + uniforms + textures)
        const byMatSig = new Map<string, Array<[any, any]>>();
        for (const [entity, mesh] of meshes) {
            const transform = components.get(entity, Transform);
            const material = components.get(entity, Material);
            if (!transform || !material) continue;
            const sig = MaterialManager.getSignature(material);
            if (!byMatSig.has(sig)) byMatSig.set(sig, []);
            byMatSig.get(sig)!.push([entity, mesh]);
        }

        const gl = this.engine.glContext.gl;
        for (const [sig, list] of byMatSig.entries()) {
            const firstEntity = list[0][0];
            const firstMat = components.get(firstEntity, Material)!;
            const shaderProg = firstMat.shader;

            shaderProg.use();
            // set global camera/proj uniforms once
            shaderProg.setUniform("u_proj", projMatrix);
            shaderProg.setUniform("u_view", viewMatrix);
            shaderProg.setUniform("u_cameraPos", camTransform.getPosition());

            for (const [entity, mesh] of list) {
                const transform = components.get(entity, Transform)!;
                const material = components.get(entity, Material)!;

                // per-instance model matrix
                shaderProg.setUniform("u_model", transform.getLocalMatrix());

                // Apply material (textures + custom uniforms)
                material.applyTo(gl);

                // Bind VAO + draw
                if (mesh.getVAO()) {
                    gl.bindVertexArray(mesh.getVAO());
                    const idxType = mesh.getIndexType() || gl.UNSIGNED_SHORT;
                    gl.drawElements(gl.TRIANGLES, mesh.getVertexCount(), idxType, 0);
                    gl.bindVertexArray(null);
                }
            }
        }
    }
}