export class ShaderLoader {
    static LoadFromURL(_url: string): string {
        // TODO : load shader from URL
        return "";
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