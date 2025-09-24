
import { ComponentManager } from "./Component";


export abstract class System {
  abstract update(dt: number, components: ComponentManager): void;
}

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

export class SystemManager {
  private systems: System[] = [];

  /**
   * Accept either a System instance or a plain function. Functions will be
   * wrapped in a FunctionSystem so the internal storage remains homogeneous.
   */
  add(system: System | ((dt: number, components: ComponentManager) => void)): void {
    if (typeof system === 'function') {
      this.systems.push(new FunctionSystem(system));
    } else {
      this.systems.push(system);
    }
  }
  update(dt: number, components: ComponentManager): void {
    for (const system of this.systems) {
      system.update(dt, components);
    }
  }
}
