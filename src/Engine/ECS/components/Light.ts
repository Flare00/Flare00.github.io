import { Vec3 } from "ts-gl-matrix";
import type { Component } from "../Component";

export type LightType = "directional" | "point" | "spot";

export class Light implements Component {
  type: LightType;
  color: Vec3;
  intensity: number;

  constructor(type: LightType = "point", color: Vec3 = new Vec3(1, 1, 1), intensity: number = 1.0) {
    this.type = type;
    this.color = color;
    this.intensity = intensity;
  }
}
