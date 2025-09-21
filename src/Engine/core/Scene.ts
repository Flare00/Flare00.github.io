import { ECS } from "../ECS/ECS";
import { Camera } from "../ECS/components/Camera";
import type { Entity } from "../ECS/Entity";
import type { Component } from "../ECS/Component";
import type { ModelGL } from "../loaders/ModelLoader";
import type { System } from "../ECS/System";

export class Scene {
    public ecs: ECS;
    public name: string;
    public active: boolean;
    private activeCamera: Entity | null = null;

    constructor(name: string = "Untitled") {
        this.name = name;
        this.active = true;
        this.ecs = new ECS();
    }

    update(dt: number): void {
        if (!this.active) return;
        this.ecs.systems.update(dt, this.ecs.components);
    }

    // Gestion des caméras
    createCamera(): Entity {
        const e = this.ecs.createCamera();
        if (this.activeCamera === null) {
            this.activeCamera = e; // Par défaut, la première caméra devient active
        }
        return e;
    }

    setActiveCamera(entity: Entity): void {
        const camera = this.ecs.components.get(entity, Camera);
        if (!camera) {
            throw new Error("L'entité donnée n'a pas de composant Camera");
        }
        this.activeCamera = entity;
    }

    getActiveCamera(): Entity | null {
        return this.activeCamera;
    }

    // Helpers pour créer/détruire des entités
    createEntity(): Entity {
        return this.ecs.createEntity();
    }

    createLight(type: "directional" | "point" | "spot"): Entity {
        return this.ecs.createLight(type);
    }

    createMesh(geometry: ModelGL, material: any): Entity {
        return this.ecs.createMesh(geometry, material);
    }

    destroyEntity(entity: Entity): void {
        if (entity === this.activeCamera) {
            this.activeCamera = null; // On supprime la caméra active
        }
        this.ecs.entities.destroy(entity);
    }

    getComponent<T extends Component>(entity: Entity, type: new (...args: any[]) => T): T | undefined {
        return this.ecs.components.get(entity, type) as T | undefined;
    }

    getAllComponentOfType<T extends Component>(type: new (...args: any[]) => T): [Entity, T][] {
        return this.ecs.components.getAllOfType(type) as [Entity, T][]
    }

    addSystem(system: System): void {
        this.ecs.systems.add(system);
    }
}
