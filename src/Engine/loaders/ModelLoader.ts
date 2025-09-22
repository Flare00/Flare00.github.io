export class ModelGL {
    public vao: WebGLVertexArrayObject;
    public vertexCount: number;
    /*public vbo: WebGLBuffer;
    public nbo: WebGLBuffer | null;
    public tbo: WebGLBuffer | null;
    public ebo: WebGLBuffer;*/

    constructor(vao: WebGLVertexArrayObject, vertexCount: number/*, vbo: WebGLBuffer, nbo: WebGLBuffer | null, tbo: WebGLBuffer | null, ebo: WebGLBuffer*/) {
        this.vao = vao;
        this.vertexCount = vertexCount;
        /*this.vbo = vbo;
        this.nbo = nbo;
        this.tbo = tbo;
        this.ebo = ebo;*/
    }

    /**
     * Génère un modèle avec attributs complets (positions, normales, uvs)
     * @param gl WebGL2 context
     * @param vertices Tableau de positions (x, y, z)
     * @param indices Tableau d'indices
     * @param normals Tableau de normales (x, y, z) optionnel
     * @param uvs Tableau de coordonnées UV (u, v) optionnel
     */
    static generate(
        gl: WebGL2RenderingContext,
        vertices: number[],
        indices: number[],
        normals?: number[],
        uvs?: number[]
    ): ModelGL {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // VBO (positions)
        const vbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const posLoc = 0;
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

        // NBO (normales)
        let nbo: WebGLBuffer | null = null;
        if (normals && normals.length > 0) {
            nbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
            const normLoc = 1;
            gl.enableVertexAttribArray(normLoc);
            gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
        }

        // TBO (UVs)
        let tbo: WebGLBuffer | null = null;
        if (uvs && uvs.length > 0) {
            tbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            const uvLoc = 2;
            gl.enableVertexAttribArray(uvLoc);
            gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
        }

        // EBO (indices)
        const ebo = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        return new ModelGL(vao!, indices.length/*, vbo, nbo, tbo, ebo*/);
    }
}

export class ModelLoader {
    static generateCube(gl: WebGL2RenderingContext, size: number): ModelGL {
        const h = size / 2;
        // 8 sommets partagés
        const vertices = [
            -h, -h, -h, // 0
            h, -h, -h,  // 1
            h, h, -h,   // 2
            -h, h, -h,  // 3
            -h, -h, h,  // 4
            h, -h, h,   // 5
            h, h, h,    // 6
            -h, h, h    // 7
        ];
        // Normales par sommet (moyenne des faces adjacentes)
        const normals = [
            -1, -1, -1,
            1, -1, -1,
            1, 1, -1,
            -1, 1, -1,
            -1, -1, 1,
            1, -1, 1,
            1, 1, 1,
            -1, 1, 1
        ];
        // UVs partagés (cube déplié simple, artefacts possibles)
        const uvs = [
            0, 0,
            1, 0,
            1, 1,
            0, 1,
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ];
        // 12 triangles (2 par face)
        // const indices = [
        //     0, 1, 2, 0, 2, 3, // front face
        //     4, 6, 5, 4, 7, 6, // back face
        //     4, 0, 3, 4, 3, 7, // left face
        //     1, 5, 6, 1, 6, 2, // right face
        //     3, 2, 6, 3, 6, 7, // upper face
        //     4, 5, 1, 4, 1, 0  // bottom face
        // ];

        const indices = [
            0, 2, 1, 0, 3, 2, // front face
            4, 5, 6, 4, 6, 7, // back face
            4, 3, 0, 4, 7, 3, // left face
            1, 6, 5, 1, 2, 6, // right face
            3, 6, 2, 3, 7, 6, // upper face
            4, 1, 5, 4, 0, 1  // bottom face
        ];

        return ModelGL.generate(gl, vertices, indices, normals, uvs);
    }

    static generateCube24Vertex(gl: WebGL2RenderingContext, size: number): ModelGL {
        const h = size / 2;
        // 24 sommets (4 par face)
        const positions = [
            // Face avant
            -h, -h, h, h, -h, h, h, h, h, -h, h, h,
            // Face arrière
            -h, -h, -h, -h, h, -h, h, h, -h, h, -h, -h,
            // Face gauche
            -h, -h, -h, -h, -h, h, -h, h, h, -h, h, -h,
            // Face droite
            h, -h, -h, h, h, -h, h, h, h, h, -h, h,
            // Face haut
            -h, h, -h, -h, h, h, h, h, h, h, h, -h,
            // Face bas
            -h, -h, -h, h, -h, -h, h, -h, h, -h, -h, h,
        ];
        const normals = [
            // Face avant
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            // Face arrière
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            // Face gauche
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            // Face droite
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            // Face haut
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            // Face bas
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        ];
        const uvs = [
            // Face avant
            0, 0, 1, 0, 1, 1, 0, 1,
            // Face arrière
            0, 0, 1, 0, 1, 1, 0, 1,
            // Face gauche
            0, 0, 1, 0, 1, 1, 0, 1,
            // Face droite
            0, 0, 1, 0, 1, 1, 0, 1,
            // Face haut
            0, 0, 1, 0, 1, 1, 0, 1,
            // Face bas
            0, 0, 1, 0, 1, 1, 0, 1,
        ];
        const indices = [
            0, 1, 2, 0, 2, 3,       // avant
            4, 5, 6, 4, 6, 7,       // arrière
            8, 9, 10, 8, 10, 11,       // gauche
            12, 13, 14, 12, 14, 15,       // droite
            16, 17, 18, 16, 18, 19,       // haut
            20, 21, 22, 20, 22, 23        // bas
        ];
        return ModelGL.generate(gl, positions, indices, normals, uvs);
    }

    static LoadFromURL(_gl: WebGL2RenderingContext, _url: string): ModelGL | null {
        // TODO : load model from URL
        return null;
    }

    static generateTriangle(gl: WebGL2RenderingContext): ModelGL {
        const vertices = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0
        ];
        const normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1
        ];
        const uvs = [
            0, 1,
            0, 0,
            1, 0
        ];
        const indices = [0, 1, 2];
        return ModelGL.generate(gl, vertices, indices, normals, uvs);
    }
}