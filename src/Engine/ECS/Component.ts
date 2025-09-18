import type { Entity } from "./Entity";

export interface Component {
}

export class ComponentManager {
  private components = new Map<string, Map<Entity, Component>>();

  add<T extends Component>(entity: Entity, component: T): void {
    const key = component.constructor.name;
    if (!this.components.has(key)) {
      this.components.set(key, new Map());
    }
    this.components.get(key)!.set(entity, component);
  }

  remove<T extends Component>(entity: Entity, type: new (...args: any[]) => T): void {
    this.components.get(type.name)?.delete(entity);
  }

  get<T extends Component>(entity: Entity, type: new (...args: any[]) => T): T | undefined {
    return this.components.get(type.name)?.get(entity) as T | undefined;
  }

  getAllOfType<T extends Component>(type: new (...args: any[]) => T): [Entity, T][] {
    const map = this.components.get(type.name);
    return map ? Array.from(map.entries()) as [Entity, T][] : [];
  }
}