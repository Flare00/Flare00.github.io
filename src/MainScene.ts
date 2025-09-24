import { Vec3 } from "ts-gl-matrix";
import { ResourceManager } from "./Engine/core/ResourceManager";
import { Scene } from "./Engine/core/Scene";
import { Transform } from "./Engine/ECS/components/Transform";
import { ModelLoader, Primitives } from "./Engine/loaders/ModelLoader";
import type { GLContext } from "./Engine/rendering/GLContext";
import { RenderSystem } from "./Engine/ECS/systems/RenderSystem";
import type { ComponentManager } from "./Engine/ECS/Component";
import { Material } from "./Engine/ECS/components/Material";
import { RotateAround } from "./Engine/ECS/systems/RotateAround";

export class MainScene extends Scene {
    protected async onInitialize(): Promise<void> {
        // Load shader program via ResourceManager (cached)
        const shader = await ResourceManager.loadShaderProgram("/assets/shaders/pbr");

        const backpack = (await this.createMeshFromURL("/assets/models/backpack/backpack.obj"))!;
        const backpackTransform = this.getComponent(backpack, Transform)!;
        backpackTransform.setPosition(new Vec3(0, 0, 0));

        const cube = this.createMesh(Primitives.generateCubeForProgram(shader.getProgram(), 1.5), new Material(shader));
        const cubeTransform = this.getComponent(cube, Transform)!;
        cubeTransform!.setPosition(new Vec3(0, -4, 0));

        const camera = this.createCamera();

        this.setActiveCamera(camera);
        const camTransform = this.getComponent(camera, Transform)!;
        camTransform.setPosition(new Vec3(2, 2, 2));
        camTransform.lookAt(new Vec3(0, 0, 0));

        this.addSystem(new RotateAround(camera, backpack, 10, 5, 2, 20))

        // this.addSystem((dt: number, components: ComponentManager) => {
        //     cubeTransform.rotate(dt * 0.5, "y");
        // });
    }
}