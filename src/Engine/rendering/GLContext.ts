export class GLContext {
  public gl: WebGL2RenderingContext;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!gl) {
      throw new Error("WebGL2 non supporté par ce navigateur");
    }

    this.gl = gl;

    // Activer quelques extensions utiles
    const exts = [
      "EXT_color_buffer_float",
      "OES_texture_float_linear",
      "EXT_texture_filter_anisotropic",
    ];
    for (const ext of exts) {
      gl.getExtension(ext);
    }
  }

  clear(r = 0, g = 0, b = 0, a = 1): void {
    const { gl } = this;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  setViewport(width: number, height: number): void {
    this.gl.viewport(0, 0, width, height);
  }

  enableDepthTest(): void {
    this.gl.enable(this.gl.DEPTH_TEST);
  }
}
