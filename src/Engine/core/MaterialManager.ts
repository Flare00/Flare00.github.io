import { Material } from "../ECS/components/Material";

export class MaterialManager {
  /**
   * Retourne une signature string unique pour un material (shader + uniform keys + texture keys)
   */
  static getSignature(mat: Material): string {
    const shaderId = (mat.shader as any)?.getProgram ? (mat.shader as any).getProgram().toString() : 'shader';
    const ukeys = Object.keys(mat.uniforms).sort().join(',');
    const tkeys = Object.keys(mat.textures).sort().join(',');
    return `${shaderId}|u:${ukeys}|t:${tkeys}`;
  }
}
