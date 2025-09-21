export class ModelGL {
    public vao: WebGLVertexArrayObject;
    public vertexCount: number;

    constructor(vao: WebGLVertexArrayObject, vertexCount: number) {
        this.vao = vao;
        this.vertexCount = vertexCount;
    }

    static generate(gl: WebGL2RenderingContext, vertices: number[], indices: number[]): ModelGL {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        const posLoc = 0; // ou utilise gl.getAttribLocation(program, "a_position") si dynamique
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

        return new ModelGL(vao!, indices.length);
    }
}

export class ModelLoader {
    static generateCube(gl: WebGL2RenderingContext, size: number): ModelGL {
        const h = size / 2;
        // 8 vertex of the cube
        const vertices = [
            -h, -h, -h, // 0
            h, -h, -h, // 1
            h, h, -h, // 2
            -h, h, -h, // 3
            -h, -h, h, // 4
            h, -h, h, // 5
            h, h, h, // 6
            -h, h, h, // 7
        ];
        // 12 triangles (2 per face)
        const indices = [
            0, 1, 2, 0, 2, 3,// front face
            4, 6, 5, 4, 7, 6,// back face
            4, 0, 3, 4, 3, 7,// left face
            1, 5, 6, 1, 6, 2,// right face
            3, 2, 6, 3, 6, 7,// upper face
            4, 5, 1, 4, 1, 0 // bottom face
        ];
        return ModelGL.generate(gl, vertices, indices);
    }

    static LoadFromURL(_gl: WebGL2RenderingContext, _url: string): ModelGL | null {
        // TODO : load model from URL
        return null;
    }

    static generateTriangle(gl: WebGL2RenderingContext): ModelGL {
        const vertices = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
        ];

        const indices = [0, 1, 2];

        return ModelGL.generate(gl, vertices, indices);
    }
}