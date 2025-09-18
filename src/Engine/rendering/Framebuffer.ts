import { GLContext } from "./GLContext";

export class Framebuffer {
  private gl: WebGL2RenderingContext;
  private fbo: WebGLFramebuffer | null;
  public textures: WebGLTexture[] = [];
  public depthBuffer: WebGLRenderbuffer | null = null;

  constructor(ctx: GLContext) {
    this.gl = ctx.gl;
    this.fbo = this.gl.createFramebuffer();
  }

  bind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
  }

  unbind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  attachTexture(
    texture: WebGLTexture,
    attachment: number = this.gl.COLOR_ATTACHMENT0
  ): void {
    this.bind();
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      attachment,
      this.gl.TEXTURE_2D,
      texture,
      0
    );
    this.unbind();
    this.textures.push(texture);
  }

  attachDepthBuffer(width: number, height: number): void {
    this.bind();
    this.depthBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER,
      this.gl.DEPTH_COMPONENT16,
      width,
      height
    );
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.RENDERBUFFER,
      this.depthBuffer
    );
    this.unbind();
  }

  checkStatus(): void {
    this.bind();
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer incomplet: " + status.toString());
    }
    this.unbind();
  }

  delete(): void {
    if (this.fbo) this.gl.deleteFramebuffer(this.fbo);
    for (const tex of this.textures) this.gl.deleteTexture(tex);
    if (this.depthBuffer) this.gl.deleteRenderbuffer(this.depthBuffer);
  }
}
