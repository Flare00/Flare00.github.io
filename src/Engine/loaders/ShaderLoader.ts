export class ShaderLoader {
    static async LoadFromURL(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement du shader: ${url}`);
        }
        return await response.text();
    }

    static pbrVertexShader(): string {
        return `#version 300 es
        precision highp float;

        in vec3 a_position;
        in vec3 a_normal;
        in vec2 a_uv;

        uniform mat4 u_proj;
        uniform mat4 u_view;
        uniform mat4 u_model;

        out vec3 v_worldPos;
        out vec3 v_normal;
        out vec2 v_uv;

        void main() {
            vec4 worldPos = u_model * vec4(a_position, 1.0);
            v_worldPos = worldPos.xyz;
            v_normal = mat3(u_model) * a_normal;
            v_uv = a_uv;
            gl_Position = u_proj * u_view * worldPos;
        }
        `;
    }

    static pbrFragmentShader(): string {
        return `#version 300 es
        precision highp float;
        out vec4 outColor;

        in vec3 v_worldPos;
        in vec3 v_normal;
        in vec2 v_uv;

        uniform vec3 u_cameraPos;
        uniform vec3 u_lightDir;
        uniform vec3 u_lightColor;
        uniform vec3 u_albedo;
        uniform float u_metallic;
        uniform float u_roughness;

        const float PI = 3.14159265359;

        // Lambertian diffuse
        vec3 diffuse(vec3 albedo) {
            return albedo / PI;
        }

        void main() {
            vec3 N = normalize(v_normal);
            vec3 V = normalize(u_cameraPos - v_worldPos);
            vec3 L = normalize(-u_lightDir);
            vec3 H = normalize(V + L);

            float NdotL = max(dot(N, L), 0.0);

            vec3 color = diffuse(u_albedo) * u_lightColor * NdotL;

            outColor = vec4(color, 1.0);
        }
        `;
    }


    static stdVertexShader(): string {
        return `#version 300 es
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
    }

    static stdFragmentShader(): string {
        return `#version 300 es
        precision highp float;
        out vec4 outColor;
        void main() {
            outColor = vec4(1.0,0.0,0.0, 1.0);
        }
    `;
    }
}