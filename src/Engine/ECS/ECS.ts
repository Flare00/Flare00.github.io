import type { ModelGL } from "../loaders/ModelLoader";
import { ComponentManager } from "./Component";
import { Camera } from "./components/Camera";
import { Light } from "./components/Light";
import type { Material } from "./components/Material";
import { Mesh } from "./components/Mesh";
import { Transform } from "./components/Transform";
import { EntityManager, type Entity } from "./Entity";
import { SystemManager } from "./System";

export class ECS {
    public entities: EntityManager;
    public components: ComponentManager;
    public systems: SystemManager;

    constructor() {
        this.entities = new EntityManager();
        this.components = new ComponentManager();
        this.systems = new SystemManager();
    }

    createEntity(): number {
        const e = this.entities.create();
        this.components.add(e, new Transform());
        return e;
    }
    createCamera(): number {
        const e = this.createEntity();
        this.components.add(e, new Camera());
        return e;
    }

    createLight(type: "directional" | "point" | "spot"): number {
        const e = this.createEntity();
        this.components.add(e, new Light(type));
        return e;
    }

    createMesh(geometry: ModelGL, material: Material | null = null): number {
        const e = this.createEntity();
        this.components.add(e, new Mesh(geometry));
        if (material != null) this.components.add(e, material);
        return e;
    }
}