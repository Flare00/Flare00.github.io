
import { ComponentManager } from "./Component";


export abstract class System {
  abstract update(dt: number, components: ComponentManager): void;
}

export class SystemManager {
  private systems: System[] = [];

  add(system: System): void {
    this.systems.push(system);
  }
  update(dt: number, components: ComponentManager): void {
    for (const system of this.systems) {
      system.update(dt, components);
    }
  }
}
