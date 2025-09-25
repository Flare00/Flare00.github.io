export class InspectorService {
  private getEngine: () => any;

  constructor(getEngine: () => any) {
    this.getEngine = getEngine;
  }

  getEcs() {
    const engine = this.getEngine();
    return engine?.scene?.ecs ?? null;
  }

  getEntityIds(): number[] {
    const ecs = this.getEcs();
    if (!ecs) return [];
    try {
      return ecs.entities.getAll();
    } catch {
      return [];
    }
  }

  getComponentsForEntity(entity: number): Array<[string, any]> {
    const ecs = this.getEcs();
    if (!ecs) return [];
    try {
      const comps = ecs.components.getComponentsForEntity(entity);
      // Ensure it's an array of [name, component]
      return Array.from(comps.entries ? comps.entries() : comps);
    } catch {
      return [];
    }
  }

  deleteEntity(entity: number) {
    const ecs = this.getEcs();
    if (!ecs) return;
    try {
      ecs.removeAllComponents(entity);
      ecs.entities.destroy(entity);
    } catch {
      // ignore
    }
  }
}
