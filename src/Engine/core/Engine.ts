import { RenderSystem } from "../ECS/systems/RenderSystem";
import { GLContext } from "../rendering/GLContext";
import type { Scene } from "./Scene";

export class Engine {
    public glContext: GLContext;
    public scene: Scene | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.glContext = new GLContext(canvas);
        GLContext.currentGLContext = this.glContext;
    }

    start(): void {
        let lastTime = performance.now();

        const loop = (time: number) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            if (this.scene) {
                this.scene.update(dt);
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    public setScene(scene: Scene) {
        this.scene = scene;
    }

    static async StartEngine(canvas: HTMLCanvasElement, scene: Scene): Promise<Engine> {
        console.log("Initializing Engine...")
        const engine = new Engine(canvas);

        console.log("Initializing Scene...")
        await scene.initialize();
        scene.addSystem(new RenderSystem(engine));
        console.log("Scene initialized...")

        engine.setScene(scene);
        console.log("Start engine...")
        engine.start();
        console.log("Engine started.")
        return engine;
    }

}