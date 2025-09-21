import type { ModelGL } from "../../loaders/ModelLoader";
import type { Component } from "../Component";

export class Mesh implements Component {
  private modelGL: ModelGL;

  constructor(modelGL: ModelGL) {
    this.modelGL = modelGL;
  }

  public getVAO() {
    return this.modelGL.vao;
  }

  public getVertexCount() {
    return this.modelGL.vertexCount;
  }
}
