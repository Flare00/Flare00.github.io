import { Material } from "../ECS/components/Material";
import { GLContext } from "../rendering/GLContext";
import { GenericLoader, type LoadedResource } from "./GenericLoader";
import { ResourceManager } from "../core/ResourceManager";

export class ModelGL {
    public vao: WebGLVertexArrayObject;
    public vertexCount: number;
    public indexType: number;
    /*public vbo: WebGLBuffer;
    public nbo: WebGLBuffer | null;
    public tbo: WebGLBuffer | null;
    public ebo: WebGLBuffer;*/

    constructor(vao: WebGLVertexArrayObject, vertexCount: number, indexType: number = 0/*, vbo: WebGLBuffer, nbo: WebGLBuffer | null, tbo: WebGLBuffer | null, ebo: WebGLBuffer*/) {
        this.vao = vao;
        this.vertexCount = vertexCount;
        this.indexType = indexType;
        /*this.vbo = vbo;
        this.nbo = nbo;
        this.tbo = tbo;
        this.ebo = ebo;*/
    }

    delete(gl?: WebGL2RenderingContext | GLContext) {
        gl = GLContext.getGL(gl);
        // Note: we don't keep references to vbo/ebo currently; delete VAO only
        if (gl && this.vao) gl.deleteVertexArray(this.vao);
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
        vertices: number[],
        indices: number[],
        normals?: number[],
        uvs?: number[],
        gl?: WebGL2RenderingContext | GLContext,
    ): ModelGL {
        gl = GLContext.getGL(gl);
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

        // EBO (indices) - choose 16 or 32 bit depending on size
        const ebo = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        let indexType: number = gl.UNSIGNED_SHORT;
        if (indices.length > 65535) {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
            indexType = gl.UNSIGNED_INT as number;
        } else {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            indexType = gl.UNSIGNED_SHORT as number;
        }

        gl.bindVertexArray(null);

        return new ModelGL(vao!, indices.length/*, vbo, nbo, tbo, ebo*/, indexType);
    }

    /**
     * Crée un ModelGL en liant les buffers aux locations d'attributs trouvées dans le programme WebGL.
     * Permet de ne pas hardcoder 0/1/2, mais d'utiliser les noms d'attributs : a_position, a_normal, a_uv
     */
    static createFromProgram(
        program: WebGLProgram,
        vertices: number[],
        indices: number[],
        normals?: number[],
        uvs?: number[],
        gl?: WebGL2RenderingContext | GLContext,

    ): ModelGL {
        gl = GLContext.getGL(gl);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // positions
        const vbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(program, "a_position");
        if (posLoc >= 0) {
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        }

        // normals
        if (normals && normals.length > 0) {
            const nbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
            const normLoc = gl.getAttribLocation(program, "a_normal");
            if (normLoc >= 0) {
                gl.enableVertexAttribArray(normLoc);
                gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
            }
        }

        // uvs
        if (uvs && uvs.length > 0) {
            const tbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            const uvLoc = gl.getAttribLocation(program, "a_uv");
            if (uvLoc >= 0) {
                gl.enableVertexAttribArray(uvLoc);
                gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
            }
        }

        // indices - choose 16 or 32 bit depending on size
        const ebo = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

        let indexType: number = gl.UNSIGNED_SHORT;
        if (indices.length > 65535) {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
            indexType = gl.UNSIGNED_INT as number;
        } else {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            indexType = gl.UNSIGNED_SHORT as number;
        }

        gl.bindVertexArray(null);

        return new ModelGL(vao!, indices.length, indexType);
    }
}

export class Primitives {
    static generateCube(size: number, gl?: WebGL2RenderingContext | GLContext): ModelGL {
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

        return ModelGL.generate(vertices, indices, normals, uvs, gl);
    }

    /**
     * Génère un cube et crée le VAO en liant les attributs au programme fourni.
     */
    static generateCubeForProgram(program: WebGLProgram, size: number, gl?: WebGL2RenderingContext | GLContext): ModelGL {
        const h = size / 2;
        const vertices = [
            -h, -h, -h,
            h, -h, -h,
            h, h, -h,
            -h, h, -h,
            -h, -h, h,
            h, -h, h,
            h, h, h,
            -h, h, h
        ];
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
        const indices = [
            0, 2, 1, 0, 3, 2,
            4, 5, 6, 4, 6, 7,
            4, 3, 0, 4, 7, 3,
            1, 6, 5, 1, 2, 6,
            3, 6, 2, 3, 7, 6,
            4, 1, 5, 4, 0, 1
        ];

        return ModelGL.createFromProgram(program, vertices, indices, normals, uvs, gl);
    }

    static generateCube24Vertex(size: number, gl?: WebGL2RenderingContext | GLContext): ModelGL {
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
        return ModelGL.generate(positions, indices, normals, uvs, gl);
    }

    static generateTriangle(gl?: WebGL2RenderingContext | GLContext): ModelGL {
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
        return ModelGL.generate(vertices, indices, normals, uvs, gl);
    }
}

export type ModelGLExtended = {
    model: ModelGL,
    material: Material | null
}

export class ModelLoader {
    static async LoadFromURL(url: string, withMaterial: boolean = true, gl?: WebGL2RenderingContext | GLContext): Promise<ModelGLExtended | null> {
        const ext = url.split('.').pop()?.toLowerCase();
        if (ext != 'obj' && ext != 'gltf' && ext != 'glb') {
            console.error("Unsupported model format for URL: " + url);
            return null;
        }

        let result = null;
        const loaded = await GenericLoader.loadResource(url);
        if (!loaded) {
            console.error("Failed to load model from URL: " + url);
            return null;
        }


        switch (ext) {
            case 'obj':


                result = await this.LoadOBJ(
                    GenericLoader.loadedResourceToText(loaded)!,
                    url,
                    gl
                );
                break;
            case 'gltf':
                result = this.loadGLTF(
                    GenericLoader.loadedResourceToText(loaded)!,
                    gl
                );
                break;
            case 'glb':
                break;
            default:
                console.error("Loading not implemented for URL: " + url);
        }

        return result;
    }

    static async LoadOBJ(objData: string, baseUrl?: string, gl?: WebGL2RenderingContext | GLContext): Promise<ModelGLExtended | null> {
        let matData = null;
        let material: Material | null = null;
        if (baseUrl)
            matData = GenericLoader.loadedResourceToText(await GenericLoader.loadResource(baseUrl.replace('.obj', '.mtl')));


        // Raw arrays as read from the OBJ (1-based indices in faces)
        const lines = objData.split(/\r?\n/);
        const rawPositions: number[] = []; // x,y,z triplets
        const rawNormals: number[] = []; // x,y,z triplets
        const rawUVs: number[] = []; // u,v pairs

        // Final buffers to feed ModelGL.generate
        const outPositions: number[] = [];
        const outNormals: number[] = [];
        const outUVs: number[] = [];
        const outIndices: number[] = [];

        // Map to deduplicate unique vertex/uv/normal combinations
        const vertexMap: Map<string, number> = new Map();

        function parseIndex(token: string, arrayLength: number): number {
            // OBJ indices are 1-based. Negative indices are relative to the end.
            const i = parseInt(token, 10);
            if (isNaN(i)) return -1;
            if (i < 0) return arrayLength + i; // e.g. -1 means last element -> index = length-1
            return i - 1;
        }

        for (let rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const parts = line.split(/\s+/);
            const tag = parts[0];

            if (tag === 'v') {
                // vertex position
                if (parts.length >= 4) {
                    rawPositions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                }
            } else if (tag === 'vn') {
                if (parts.length >= 4) rawNormals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            } else if (tag === 'vt') {
                // UVs may contain 3 components but we only use first two
                if (parts.length >= 3) rawUVs.push(parseFloat(parts[1]), parseFloat(parts[2]));
            } else if (tag === 'f') {
                // face - can be tri/quad/ngon; triangulate by fan
                const faceVerts = parts.slice(1);
                if (faceVerts.length < 3) continue;

                // Build list of vertex descriptors for the face
                const descriptors: { v: number, vt: number | null, vn: number | null }[] = [];
                for (const fv of faceVerts) {
                    // possible formats: v, v/vt, v//vn, v/vt/vn
                    const comps = fv.split('/');
                    const vIdx = parseIndex(comps[0], rawPositions.length / 3);
                    const vtIdx = comps.length > 1 && comps[1] !== '' ? parseIndex(comps[1], rawUVs.length / 2) : null;
                    const vnIdx = comps.length > 2 && comps[2] !== '' ? parseIndex(comps[2], rawNormals.length / 3) : null;
                    descriptors.push({ v: vIdx, vt: vtIdx, vn: vnIdx });
                }

                // Triangulate face descriptors (fan)
                for (let i = 1; i < descriptors.length - 1; i++) {
                    const tri = [descriptors[0], descriptors[i], descriptors[i + 1]];
                    for (const d of tri) {
                        const key = `${d.v}/${d.vt !== null ? d.vt : ''}/${d.vn !== null ? d.vn : ''}`;
                        let index = vertexMap.get(key);
                        if (index === undefined) {
                            index = outPositions.length / 3;
                            vertexMap.set(key, index);

                            // push position
                            if (d.v >= 0 && d.v * 3 + 2 < rawPositions.length) {
                                outPositions.push(
                                    rawPositions[d.v * 3 + 0],
                                    rawPositions[d.v * 3 + 1],
                                    rawPositions[d.v * 3 + 2]
                                );
                            } else {
                                outPositions.push(0, 0, 0);
                            }

                            // push uv
                            if (d.vt !== null && d.vt >= 0 && d.vt * 2 + 1 < rawUVs.length) {
                                outUVs.push(rawUVs[d.vt * 2 + 0], rawUVs[d.vt * 2 + 1]);
                            } else {
                                // leave uvs empty for now; we will keep outUVs length in sync by pushing 0,0
                                outUVs.push(0, 0);
                            }

                            // push normal
                            if (d.vn !== null && d.vn >= 0 && d.vn * 3 + 2 < rawNormals.length) {
                                outNormals.push(
                                    rawNormals[d.vn * 3 + 0],
                                    rawNormals[d.vn * 3 + 1],
                                    rawNormals[d.vn * 3 + 2]
                                );
                            } else {
                                outNormals.push(0, 0, 0);
                            }
                        }
                        outIndices.push(index);
                    }
                }
            }
        }

        // If no normals were provided at all, clear outNormals so ModelGL.generate will skip normals
        if (rawNormals.length === 0) {
            outNormals.length = 0;
        }

        // If no uvs were provided at all, clear outUVs so ModelGL.generate will skip uvs
        if (rawUVs.length === 0) {
            outUVs.length = 0;
        }

        // Minimal MTL parsing: read Kd (diffuse) and map_Kd (albedo texture) if provided.
        if (matData) {
            const matLines = matData.split(/\r?\n/);
            let current: { name?: string, Kd?: [number, number, number], map_Kd?: string } | null = null;
            for (let l of matLines) {
                const line = l.trim();
                if (!line || line.startsWith('#')) continue;
                const parts = line.split(/\s+/);
                const tag = parts[0];
                if (tag === 'newmtl') {
                    if (current) break; // only parse first material for now
                    current = { name: parts[1] };
                } else if (tag === 'Kd' && current) {
                    current.Kd = [parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0];
                } else if ((tag === 'map_Kd' || tag === 'map_kd') && current) {
                    current.map_Kd = parts.slice(1).join(' ');
                }
            }
            // We don't create a Material here because a ShaderProgram is required to construct it.
            if (current) {
                console.info('MTL parsed (first material):', current);
            }
        }

        // If no normals were provided in file, compute smooth normals per-vertex
        if (rawNormals.length === 0) {
            // compute face normals and accumulate
            const vcount = outPositions.length / 3;
            const accumNormals = new Array<number>(vcount * 3).fill(0);
            for (let i = 0; i < outIndices.length; i += 3) {
                const i0 = outIndices[i + 0];
                const i1 = outIndices[i + 1];
                const i2 = outIndices[i + 2];
                const p0x = outPositions[i0 * 3 + 0], p0y = outPositions[i0 * 3 + 1], p0z = outPositions[i0 * 3 + 2];
                const p1x = outPositions[i1 * 3 + 0], p1y = outPositions[i1 * 3 + 1], p1z = outPositions[i1 * 3 + 2];
                const p2x = outPositions[i2 * 3 + 0], p2y = outPositions[i2 * 3 + 1], p2z = outPositions[i2 * 3 + 2];

                const ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
                const vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;
                // cross product u x v
                const nx = uy * vz - uz * vy;
                const ny = uz * vx - ux * vz;
                const nz = ux * vy - uy * vx;

                accumNormals[i0 * 3 + 0] += nx; accumNormals[i0 * 3 + 1] += ny; accumNormals[i0 * 3 + 2] += nz;
                accumNormals[i1 * 3 + 0] += nx; accumNormals[i1 * 3 + 1] += ny; accumNormals[i1 * 3 + 2] += nz;
                accumNormals[i2 * 3 + 0] += nx; accumNormals[i2 * 3 + 1] += ny; accumNormals[i2 * 3 + 2] += nz;
            }
            // normalize
            for (let vi = 0; vi < outPositions.length; vi += 3) {
                const nx = accumNormals[vi + 0];
                const ny = accumNormals[vi + 1];
                const nz = accumNormals[vi + 2];
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
                outNormals[vi + 0] = nx / len;
                outNormals[vi + 1] = ny / len;
                outNormals[vi + 2] = nz / len;
            }
        }

        // Parse MTL and create Material (using pbr shader) if possible
        let parsedMTL: { name?: string, Kd?: [number, number, number], map_Kd?: string } | null = null;
        if (matData) {
            const matLines = matData.split(/\r?\n/);
            let current: { name?: string, Kd?: [number, number, number], map_Kd?: string } | null = null;
            for (let l of matLines) {
                const line = l.trim();
                if (!line || line.startsWith('#')) continue;
                const parts = line.split(/\s+/);
                const tag = parts[0];
                if (tag === 'newmtl') {
                    if (current) break; // only parse first material for now
                    current = { name: parts[1] };
                } else if (tag === 'Kd' && current) {
                    current.Kd = [parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0];
                } else if ((tag === 'map_Kd' || tag === 'map_kd') && current) {
                    current.map_Kd = parts.slice(1).join(' ');
                }
            }
            parsedMTL = current;
        }

        try {
            const model = ModelGL.generate(outPositions, outIndices, outNormals.length > 0 ? outNormals : undefined, outUVs.length > 0 ? outUVs : undefined, gl);

            // If MTL provided and caller requested material, try to create one using pbr shader
            if (parsedMTL && baseUrl) {
                try {
                    const shader = await ResourceManager.loadShaderProgram('/assets/shaders/pbr', GLContext.getGL(gl));
                    const mat = new Material(shader);
                    if (parsedMTL.Kd) {
                        // pass as albedo
                        shader.set('u_albedo', new Float32Array(parsedMTL.Kd));
                        shader.set('u_useAlbedoMap', 0);
                        mat.setUniform('u_albedo', new Float32Array(parsedMTL.Kd));
                    }
                    if (parsedMTL.map_Kd) {
                        // resolve path relative to baseUrl
                        let texPath = parsedMTL.map_Kd;
                        try {
                            const base = new URL(baseUrl, window.location.href);
                            const texUrl = new URL(texPath, base).toString();
                            texPath = texUrl;
                        } catch (_) {
                            // fallback: use as-is
                        }
                        mat.setTextureUniform('u_albedoMap', texPath);
                        mat.setUniform('u_useAlbedoMap', 1);
                    }
                    material = mat;
                } catch (e) {
                    console.warn('Failed to create Material from MTL', e);
                }
            }

            return { model, material };
        } catch (e) {
            console.error('Failed to create ModelGL from OBJ data', e);
            return null;
        }
    }

    static loadGLTF(objData: string, gl?: WebGL2RenderingContext | GLContext): ModelGLExtended | null {
        let material: Material | null = null;

        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const vertexIndices: number[] = [];
        const normalIndices: number[] = [];
        const uvIndices: number[] = [];


        return { model: ModelGL.generate(positions, vertexIndices, normals, uvs, gl), material: material };
    }
}