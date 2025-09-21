export class GLContext {
  private canvas: HTMLCanvasElement;
  public gl: WebGL2RenderingContext;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;


    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!gl) {
      throw new Error("WebGL2 non supporté par ce navigateur");
    } else {
      console.log("WebGL2 context initialized", gl);
    }

    this.gl = gl;

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas.bind(this));
  }

  clear(r = 0, g = 0, b = 0, a = 1): void {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    //this.gl.depthFunc(this.gl.LEQUAL);            // les choses proches cachent les choses lointaines
    // this.gl.enable(this.gl.DEPTH_TEST);           // activer le test de profondeur
    //this.gl.clearDepth(1.0);                 // effacement de la profondeur
  }

  private setViewport(width: number, height: number): void {
    console.log("Set viewport", width, height);
    this.gl.viewport(0, 0, width, height);
  }

  enableDepthTest(): void {
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  private resizeCanvas(): void {
    console.log("Resizing canvas to", window.innerWidth, window.innerHeight);
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.setViewport(this.canvas.width, this.canvas.height);
  }

  public getAspectRatio(): number {
    return this.canvas.width / this.canvas.height;
  }


}
