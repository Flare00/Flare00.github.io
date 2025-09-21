import { Mat4, Vec3 } from "ts-gl-matrix";
import type { Component } from "../Component";

export class Camera implements Component {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  active: boolean = true;

  constructor(fov: number = 90, aspect: number = 1.0, near: number = 0.1, far: number = 1000) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  getProjectionMatrix(aspect?: number): Mat4 {
    let projection = new Mat4();
    const a = aspect ?? this.aspect;
    const fovY = 2 * Math.atan(Math.tan((this.fov * Math.PI) / 360) / a) * 180 / Math.PI;
    Mat4.perspectiveNO(projection, (fovY * Math.PI) / 180, a, this.near, this.far);
    return projection;
  }

  setActive(active: boolean) {
    this.active = active;
  }
}
