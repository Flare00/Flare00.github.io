export class ModelLoader {

    static LoadFromURL(_gl: WebGL2RenderingContext, _url: string): WebGLVertexArrayObject | null {
        // TODO : load model from URL
        return null;
    }

    static generateTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject, vertexCount: number } {
        const vertices = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
        ];

        const indices = [0, 1, 2];

        return ModelLoader.generateVAO(gl, vertices, indices);
    }

    static cube(gl: WebGL2RenderingContext) {
        const vertices = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
        ];

        const indices = [0, 1, 2];

        return ModelLoader.generateVAO(gl, vertices, indices);

    }

    static generateVAO(gl: WebGL2RenderingContext, vertices: number[], indices: number[]) : { vao: WebGLVertexArrayObject , vertexCount: number } {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        return { vao: vao, vertexCount: vertices.length };
    }
}