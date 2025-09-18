import { Mat4, Vec3 } from "ts-gl-matrix";
import type { Component } from "../Component";

export class Camera implements Component {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  projectionMatrix: Mat4 = new Mat4();
  viewMatrix: Mat4 = new Mat4();

  constructor(fov: number = 60, aspect: number = 1.0, near: number = 0.1, far: number = 1000) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.updateProjection();
  }

  updateProjection() {
    Mat4.perspectiveNO(this.projectionMatrix, (this.fov * Math.PI) / 180, this.aspect, this.near, this.far);
  }

  updateView(position: Vec3, target: Vec3, up: Vec3 = new Vec3(0, 1, 0)) {
    Mat4.lookAt(this.viewMatrix, position, target, up);
  }
}
