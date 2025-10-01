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

  public getIndexType() {
    // indexType stored as numeric GL enum in ModelGL
    return this.modelGL.indexType || 0;
  }

  /**
   * Dispose the underlying GPU resources for this mesh.
   * If a GL context is provided it will be used to delete GPU objects.
   */
  public dispose(gl?: WebGL2RenderingContext) {
    try {
      if (this.modelGL && typeof (this.modelGL as any).delete === 'function') {
        (this.modelGL as any).delete(gl);
      }
    } catch (e) {
      console.warn('Error disposing ModelGL', e);
    }
  }


}
