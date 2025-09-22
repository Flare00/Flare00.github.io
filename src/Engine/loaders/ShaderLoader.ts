export class ShaderData {
    vertexShader: string;
    fragmentShader: string;
    geometryShader?: string;
    tessControlShader?: string;
    tessEvalShader?: string;

    constructor(vertexShader: string, fragmentShader: string, geometryShader?: string, tessControlShader?: string, tessEvalShader?: string) {
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.geometryShader = geometryShader;
        this.tessControlShader = tessControlShader;
        this.tessEvalShader = tessEvalShader;
    }
}

export class ShaderLoader {
    /**
     * Charge un shader depuis une URL (fichier unique) ou un dossier (plusieurs fichiers)
     * Si url est un fichier, retourne le texte du shader.
     * Si url est un dossier, retourne un objet { vertexShader, fragmentShader, ... }
     * Les extensions reconnues : .vs (vertex), .fs (fragment), .gs (geometry), .ts (tess control), .tes (tess eval)
     */
    /**
     * Charge un shader depuis un fichier unique (retourne le texte du shader)
     */
    static async LoadShaderFile(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement du shader: ${url}`);
        }
        return await response.text();
    }

    /**
     * Charge un dossier de shaders (retourne un ShaderData)
     * Le serveur doit retourner un JSON listant les fichiers du dossier
     * Ex: GET url => ["shader.vs", "shader.fs", ...]
     */
    static async LoadShaderFolder(url: string): Promise<ShaderData> {

        if(!url.endsWith("/")) {
            url += "/";
        }
        console.log("Try to load shaders from folder",url)

        // On suppose que url finit par / et que le nom du dossier est le nom des fichiers
        // Ex: /shaders/monshader/ => /shaders/monshader/monshader.vs, etc.
        const folder = url.endsWith("/") ? url : url + "/";
        // Récupère le nom du dossier sans slash final
        const parts = folder.split("/").filter(Boolean);
        const baseName = parts[parts.length - 1];
        const tryFiles = [
            { ext: ".vs", key: "vertexShader" },
            { ext: ".fs", key: "fragmentShader" },
            { ext: ".gs", key: "geometryShader" },
            { ext: ".ts", key: "tessControlShader" },
            { ext: ".tes", key: "tessEvalShader" }
        ];
        let vertexShader = "";
        let fragmentShader = "";
        let geometryShader: string | undefined = undefined;
        let tessControlShader: string | undefined = undefined;
        let tessEvalShader: string | undefined = undefined;
        await Promise.all(tryFiles.map(async ({ ext, key }) => {
            const fileUrl = url + baseName + ext;

            try {
                const resp = await fetch(fileUrl);
                if (resp.ok) {
                    const src = await resp.text();
                    switch (key) {
                        case "vertexShader": vertexShader = src; break;
                        case "fragmentShader": fragmentShader = src; break;
                        case "geometryShader": geometryShader = src; break;
                        case "tessControlShader": tessControlShader = src; break;
                        case "tessEvalShader": tessEvalShader = src; break;
                    }
                }
            } catch (e) {
                // Ignore les erreurs pour les fichiers optionnels
            }
        }));
        if (!vertexShader || !fragmentShader) {
            throw new Error("Le dossier ne contient pas de vertexShader (.vs) ou fragmentShader (.fs)");
        }
        console.log("Loaded shaders from folder",url)
        return new ShaderData(vertexShader, fragmentShader, geometryShader, tessControlShader, tessEvalShader);
    }

    static testShader(): ShaderData {
        const vertexShader = `#version 300 es
        precision highp float;

        in vec3 a_position;

        uniform mat4 u_proj;
        uniform mat4 u_view;
        uniform mat4 u_model;


        void main() {
            vec4 worldPos = u_model * vec4(a_position, 1.0);
            gl_Position = u_proj * u_view * worldPos;
        }
        `;
        const fragmentShader = `#version 300 es
        precision highp float;
        out vec4 outColor;
        void main() {
            outColor = vec4(1.0,0.0,0.0, 1.0);
        }
        `;
        return new ShaderData(vertexShader, fragmentShader);
    }
}