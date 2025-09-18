import type { Camera } from "../ECS/components/Camera";
import type { Entity } from "../ECS/Entity";
import { ECS } from "../ECS/ECS";

export class Scene {
    public mainCamera: Camera | null = null;
    public root: Entity;
    public ecs: ECS;

    constructor(ecs?: ECS, root?: Entity) {
        this.ecs = ecs ?? new ECS();
        this.root = root ?? this.ecs.createEntity();
        this.ecs.setRoot(this.root);
    }

    setMainCamera(camera: Camera) {
        this.mainCamera = camera;
    }
}