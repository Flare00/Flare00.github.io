import { Engine } from "../Engine/core/Engine";
import type { Entity } from "../Engine/ECS/Entity";
import { Transform } from "../Engine/ECS/components/Transform";
import { Camera } from "../Engine/ECS/components/Camera";
import { Light } from "../Engine/ECS/components/Light";
import { Material } from "../Engine/ECS/components/Material";
import { Vec4 } from "ts-gl-matrix";

// Lightweight DOM helper
function el(tag: string, cls?: string, html?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export class Inspector {
  private engine: Engine;
  private root: HTMLElement;

  constructor(engine: Engine) {
    this.engine = engine;
    this.root = document.createElement("div");
    this.root.id = "inspector-root";
    document.body.appendChild(this.root);
    this.root.innerHTML = `
      <div id="inspector-panel">
        <div id="inspector-header">Inspector <span id="inspector-controls"></span></div>
        <div id="inspector-entities"></div>
      </div>
    `;

    // inject controls: refresh and collapse toggle
    const controls = this.root.querySelector<HTMLSpanElement>("#inspector-controls")!;
    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'inspector-refresh';
    refreshBtn.textContent = 'Refresh';
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'inspector-toggle';
    toggleBtn.textContent = '▾';
    controls.appendChild(refreshBtn);
    controls.appendChild(toggleBtn);
    refreshBtn.addEventListener("click", () => this.refresh());
    const panel = this.root.querySelector('#inspector-panel') as HTMLElement;
    // start expanded by default
    toggleBtn.textContent = '▾';
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      // rotate caret
      toggleBtn.textContent = panel.classList.contains('collapsed') ? '▸' : '▾';
    });

    this.refresh();
  }

  private refresh() {
    const container = this.root.querySelector("#inspector-entities") as HTMLElement;
    container.innerHTML = "";
    const ecs = (this.engine as any).scene?.ecs;
    if (!ecs) {
      container.appendChild(el("div", "inspector-note", "No ECS available"));
      return;
    }

    const entities: Entity[] = ecs.entities.getAll();
    for (const id of entities) {
      const card = el("div", "inspector-entity") as HTMLElement;
      // expanded by default
      const title = el("div", "inspector-entity-title collapsible") as HTMLElement;
      title.innerText = `Entity ${id}`;
      const body = el("div", "inspector-entity-body") as HTMLElement;
      title.addEventListener("click", () => {
        card.classList.toggle('collapsed');
      });
      card.appendChild(title);
      card.appendChild(body);

      // components list
      const comps = ecs.components.getComponentsForEntity(id as number);
      for (const [typeName, comp] of comps) {
        const compEl = el("div", "inspector-component") as HTMLElement;
        // expanded by default
        const header = el("div", "inspector-component-header collapsible") as HTMLElement;
        header.innerText = typeName;
        const compBody = el("div", "inspector-component-body") as HTMLElement;
        header.addEventListener("click", () => {
          compEl.classList.toggle('collapsed');
        });
        compEl.appendChild(header);
        compEl.appendChild(compBody);

        // Render controls depending on type
        if (comp instanceof Transform) {
          this.renderTransformControls(compEl, id as number, comp as Transform);
        } else if (comp instanceof Camera) {
          this.renderCameraControls(compEl, id as number, comp as Camera);
        } else if (comp instanceof Light) {
          this.renderLightControls(compEl, id as number, comp as Light);
        } else if ((comp as Material) && (comp as Material).shader) {
          this.renderMaterialControls(compEl, id as number, comp as Material);
        } else {
          // generic dump
          const pre = el("pre", "inspector-json", JSON.stringify(comp, null, 2));
          compEl.appendChild(pre);
        }

        card.querySelector('.inspector-entity-body')!.appendChild(compEl);
      }

      // actions
      const actions = el("div", "inspector-entity-actions") as HTMLElement;
      const del = el("button", "inspector-btn", "Delete") as HTMLButtonElement;
      del.addEventListener("click", () => {
        ecs.removeAllComponents(id as number);
        ecs.entities.destroy(id as number);
        this.refresh();
      });
      actions.appendChild(del);
      card.querySelector('.inspector-entity-body')!.appendChild(actions);
      container.appendChild(card);
    }
  }

  private renderTransformControls(parent: HTMLElement, entity: number, t: Transform) {
    const pos = t.getPosition();
    const rot = t.getRotationEuler();
    const scale = t.getScale();

    const makeVec3Row = (label: string, vec: any, setter: (v: any) => void) => {
      const row = el("div", "inspector-row") as HTMLElement;
      row.appendChild(el("div", "inspector-label", label));
      const x = el("input") as HTMLInputElement;
      x.value = String(vec.x);
      x.type = "number";
      const y = el("input") as HTMLInputElement;
      y.value = String(vec.y);
      y.type = "number";
      const z = el("input") as HTMLInputElement;
      z.value = String(vec.z);
      z.type = "number";
      row.appendChild(x);
      row.appendChild(y);
      row.appendChild(z);
      const apply = el("button", "inspector-small-btn", "Apply") as HTMLButtonElement;
      apply.addEventListener("click", () => {
        const nv = { x: parseFloat(x.value), y: parseFloat(y.value), z: parseFloat(z.value) };
        setter(nv);
        this.refresh();
      });
      row.appendChild(apply);
      return row;
    };

    parent.appendChild(makeVec3Row("Position", pos, (v) => t.setPosition(v)));
    parent.appendChild(makeVec3Row("Rotation (deg)", rot, (v) => t.setRotationEuler(v)));
    parent.appendChild(makeVec3Row("Scale", scale, (v) => t.setScale(v)));
  }

  private renderCameraControls(parent: HTMLElement, entity: number, c: Camera) {
    const container = el("div") as HTMLElement;
    container.appendChild(el("label", "inspector-label", "FOV"));
    const fov = el("input") as HTMLInputElement;
    fov.type = "number";
    fov.value = String(c.fov);
    container.appendChild(fov);
    container.appendChild(el("label", "inspector-label", "Near"));
    const near = el("input") as HTMLInputElement;
    near.type = "number";
    near.value = String(c.near);
    container.appendChild(near);
    container.appendChild(el("label", "inspector-label", "Far"));
    const far = el("input") as HTMLInputElement;
    far.type = "number";
    far.value = String(c.far);
    container.appendChild(far);
    const apply = el("button", "inspector-small-btn", "Apply") as HTMLButtonElement;
    apply.addEventListener("click", () => {
      c.fov = parseFloat(fov.value);
      c.near = parseFloat(near.value);
      c.far = parseFloat(far.value);
      this.refresh();
    });
    container.appendChild(apply);
    parent.appendChild(container);
  }

  private renderLightControls(parent: HTMLElement, entity: number, l: Light) {
    const container = el("div") as HTMLElement;
    container.appendChild(el("label", "inspector-label", "Color"));
    const r = el("input") as HTMLInputElement; r.type = "number"; r.value = String(l.color.x);
    const g = el("input") as HTMLInputElement; g.type = "number"; g.value = String(l.color.y);
    const b = el("input") as HTMLInputElement; b.type = "number"; b.value = String(l.color.z);
    container.appendChild(r); container.appendChild(g); container.appendChild(b);
    container.appendChild(el("label", "inspector-label", "Intensity"));
    const intensity = el("input") as HTMLInputElement; intensity.type = "number"; intensity.value = String(l.intensity);
    container.appendChild(intensity);
    const apply = el("button", "inspector-small-btn", "Apply") as HTMLButtonElement;
    apply.addEventListener("click", () => {
      l.color.x = parseFloat(r.value); l.color.y = parseFloat(g.value); l.color.z = parseFloat(b.value);
      l.intensity = parseFloat(intensity.value);
      this.refresh();
    });
    container.appendChild(apply);
    parent.appendChild(container);
  }

  private renderMaterialControls(parent: HTMLElement, entity: number, m: Material) {
    const container = el("div") as HTMLElement;

    // show uniforms
    const uni = el("div", "inspector-subsection", "Uniforms") as HTMLElement;
    for (const [k, v] of Object.entries(m.uniforms)) {
      const row = el("div", "inspector-row") as HTMLElement;
      row.appendChild(el("div", "inspector-label", k));
      const input = el("input") as HTMLInputElement;
      input.value = String(v);
      row.appendChild(input);
      const apply = el("button", "inspector-small-btn", "Set") as HTMLButtonElement;
      apply.addEventListener("click", () => {
        m.setUniform(k, this.parseValue(input.value));
        this.refresh();
      });
      row.appendChild(apply);
      uni.appendChild(row);
    }
    container.appendChild(uni);

    // textures & per-texture fallbacks
    const texs = el("div", "inspector-subsection", "Textures / Fallbacks") as HTMLElement;
    for (const [name, entry] of Object.entries(m.textures)) {
      const row = el("div", "inspector-row") as HTMLElement;
      row.appendChild(el("div", "inspector-label", name));
      const input = el("input") as HTMLInputElement; input.value = (entry && (entry as any).url) ? (entry as any).url : '';
      row.appendChild(input);
      const set = el("button", "inspector-small-btn", "Set URL") as HTMLButtonElement;
      set.addEventListener("click", () => { m.setTextureUniform(name, input.value); this.refresh(); });
      row.appendChild(set);

      // fallback color (per-texture)
      const col = (entry && (entry as any).fallback) ? (entry as any).fallback : undefined;
      const colorInput = el("input") as HTMLInputElement; colorInput.type = "color";
      if (col) colorInput.value = this.vec4ToHex(col);
      const setFb = el("button", "inspector-small-btn", "Set Fallback") as HTMLButtonElement;
      setFb.addEventListener("click", () => {
        const rgba = this.hexToVec4(colorInput.value);
        m.setFallback(name, rgba);
        this.refresh();
      });
      row.appendChild(colorInput);
      row.appendChild(setFb);

      texs.appendChild(row);
    }
    container.appendChild(texs);

    // Note: type-level fallbacks removed. Use per-texture fallbacks above.

    parent.appendChild(container);
  }

  private parseValue(v: string) {
    // try number
    const n = parseFloat(v);
    if (!isNaN(n) && v.trim() !== "") return n;
    // try JSON
    try { return JSON.parse(v); } catch { }
    return v;
  }


}
