import { GLContext } from "../rendering/GLContext";
import { Renderer } from "../rendering/Renderer";
import type { Scene } from "./Scene";

export class Engine {
    private lastTime = 0;
    public glContext: GLContext;
    public renderer: Renderer;
    public currentScene: Scene | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.glContext = new GLContext(canvas);
        this.renderer = new Renderer(this.glContext.gl);
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    private loop(now: number): void {
        if (this.currentScene === null) {
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.renderer.render(dt, this.currentScene);

        requestAnimationFrame(this.loop.bind(this));
    }

    public setScene(scene: Scene) {
        this.currentScene = scene;
    }
}