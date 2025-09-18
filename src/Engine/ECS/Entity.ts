export type Entity = number;

export class EntityManager {
  private nextId = 0;
  private entities: Set<Entity> = new Set();

  constructor() {  }

  create(): Entity {
    const id = this.nextId++;
    this.entities.add(id);
    return id;
  }

  destroy(entity: Entity): void {
    this.entities.delete(entity);
  }

  getAll(): Entity[] {
    return Array.from(this.entities);
  }
}
