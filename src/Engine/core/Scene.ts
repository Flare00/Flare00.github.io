import { ECS } from "../ECS/ECS";
import type { Engine } from "./Engine";
import { Camera } from "../ECS/components/Camera";
import type { Entity } from "../ECS/Entity";
import type { Component, ComponentManager } from "../ECS/Component";
import { ModelGL, ModelGLExtended, ModelLoader } from "../loaders/ModelLoader";
import type { System } from "../ECS/System";
import { Material } from "../ECS/components/Material";

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

    // Runtime-provided initializer: a callback that can be set/cleared at runtime
    // It will be invoked when `initialize()` is called, before the subclass hook.
    private runtimeInitializer: ((scene: Scene) => Promise<void> | void) | null = null;

    /**
     * Protected hook for subclasses to override for scene-specific initialization.
     * It's called by `initialize()` after any runtime-provided initializer.
     * Can be async.
     */
    protected async onInitialize(): Promise<void> { }

    public async initialize(): Promise<void> {
        if (!this.active) return;

        if (this.runtimeInitializer) {
            await this.runtimeInitializer(this);
        }

        await this.onInitialize();
    }

    /**
     * Set a runtime initializer callback. The callback receives the scene and may
     * return a Promise to perform async setup.
     */
    public setInitializer(fn: ((scene: Scene) => Promise<void> | void) | null): void {
        this.runtimeInitializer = fn;
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

    createMesh(model: ModelGL | ModelGLExtended, material: Material | null = null): Entity {
        let mod: ModelGL;
        // Use a property check instead of instanceof, since ModelGLExtended is a type
        if (model instanceof ModelGL) {
            mod = model;
        } else {
            mod = model.model
            if (!material && (model as ModelGLExtended).material)
                material = (model as ModelGLExtended).material;
        }

        return this.ecs.createMesh(mod, material);
    }

    async createMeshFromURL(url: string, material?: Material): Promise<Entity | null> {
        console.log("Loading model from URL:", url);
        const model = await ModelLoader.LoadFromURL(url, !material);
        console.log("Model exist :", model != null);
        if (model == null) return null;
        return this.createMesh(model, material);
    }



    destroyEntity(entity: Entity, engine?: Engine): void {
        if (entity === this.activeCamera) {
            this.activeCamera = null; // On supprime la caméra active
        }

        // Attempt to call dispose on components that provide it (e.g. Mesh)
        const comps = this.ecs.components.getAllOfType<any>((Object as any));
        // The ComponentManager doesn't provide a direct API to enumerate per-entity components
        // so rely on ComponentManager internal maps via getAllOfType when needed. Simpler approach:
        try {
            // iterate over all component types and try to dispose per-entity
            for (const [typeName, map] of (this.ecs.components as any).components.entries()) {
                const comp = map.get(entity);
                if (comp && typeof comp.dispose === 'function') {
                    try { comp.dispose(engine?.glContext?.gl); } catch (e) { console.warn('dispose failed for', typeName, e); }
                }
            }
        } catch (e) {
            // Fallback: ignore if internal shapes are different
        }

        this.ecs.components.removeAllComponents(entity);
        this.ecs.entities.destroy(entity);
    }

    getComponent<T extends Component>(entity: Entity, type: new (...args: any[]) => T): T | undefined {
        return this.ecs.components.get(entity, type) as T | undefined;
    }

    getAllComponentOfType<T extends Component>(type: new (...args: any[]) => T): [Entity, T][] {
        return this.ecs.components.getAllOfType(type) as [Entity, T][]
    }

    /**
     * Add a system. Accepts either a System instance or a plain function
     * with signature (dt: number, components: ComponentManager) => void.
     */
    addSystem(system: System | ((dt: number, components: ComponentManager) => void)): void {
        this.ecs.systems.add(system as any);
    }
}
