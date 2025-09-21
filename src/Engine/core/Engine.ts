import { GLContext } from "../rendering/GLContext";
import type { Scene } from "./Scene";

export class Engine {
    public glContext: GLContext;
    public scene: Scene | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.glContext = new GLContext(canvas);
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





}