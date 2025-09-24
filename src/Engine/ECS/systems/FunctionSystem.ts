import type { ComponentManager } from "../Component";
import { System } from "../System";

/**
 * Lightweight wrapper that allows passing a plain function as a System.
 * Example: new FunctionSystem((dt, components) => { ... })
 */
export class FunctionSystem extends System {
    private fn: (dt: number, components: ComponentManager) => void;
    constructor(fn: (dt: number, components: ComponentManager) => void) {
        super();
        this.fn = fn;
    }
    update(dt: number, components: ComponentManager): void {
        this.fn(dt, components);
    }
}