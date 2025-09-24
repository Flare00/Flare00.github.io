#version 300 es
precision highp float;
out vec4 outColor;

in vec3 v_worldPos;
in vec3 v_normal;
in vec2 v_uv;

uniform vec3 u_cameraPos;
uniform vec3 u_lightDir;
uniform vec3 u_lightColor;
uniform vec3 u_albedo;
uniform bool u_useAlbedoMap;
uniform sampler2D u_albedoMap;
uniform float u_metallic;
uniform float u_roughness;

const float PI = 3.14159265359;

// Lambertian diffuse
vec3 diffuse(vec3 albedo) {
    return albedo * (1.0 / PI);
}

// Fresnel-Schlick approximation
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    float t = pow(1.0 - cosTheta, 5.0);
    return F0 + (1.0 - F0) * t;
}

// Normal Distribution Function (GGX)
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float denom = NdotH2 * (a2 - 1.0) + 1.0;
    return a2 / (PI * denom * denom);
}

// Geometry function (Schlick-GGX)
float GeometrySchlickGGX(float NdotV, float roughness) {
    float k = pow(roughness + 1.0, 2.0) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    return GeometrySchlickGGX(NdotV, roughness) * GeometrySchlickGGX(NdotL, roughness);
}

void main() {
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_cameraPos - v_worldPos);
    vec3 L = normalize(-u_lightDir);
    vec3 H = normalize(V + L);

    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float VdotH = max(dot(V, H), 0.0);

    // Albedo (avec ou sans texture)
    vec3 albedo = u_albedo;
    if(u_useAlbedoMap) {
        albedo *= texture(u_albedoMap, v_uv).rgb;
    }

    // F0: base reflectivity
    vec3 F0 = mix(vec3(0.04), albedo, u_metallic);
    // Fresnel
    vec3 F = fresnelSchlick(VdotH, F0);
    // Distribution
    float D = DistributionGGX(N, H, u_roughness);
    // Geometry
    float G = GeometrySmith(N, V, L, u_roughness);

    // Specular
    float denominator = 4.0 * NdotV * NdotL + 0.001;
    vec3 specular = (D * G * F) / denominator;

    // kS: specular, kD: diffuse
    float kS = max(max(F.r, F.g), F.b);
    float kD = (1.0 - kS) * (1.0 - u_metallic);

    // Lambertian diffuse
    vec3 diffuseCol = diffuse(albedo);

    vec3 color = (kD * diffuseCol + specular) * u_lightColor * NdotL;


    outColor = vec4(color, 1.0);
    outColor = vec4(N, 1.0);
    //outColor = vec4(1.0,0,0, 1.0);
}