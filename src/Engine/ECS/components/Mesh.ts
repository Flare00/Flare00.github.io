import type { Component } from "../Component";

export class Mesh implements Component {
  vao: WebGLVertexArrayObject | null = null;
  vertexCount: number = 0;

  constructor(vao: WebGLVertexArrayObject | null = null, vertexCount: number = 0) {
    this.vao = vao;
    this.vertexCount = vertexCount;
  }
}
