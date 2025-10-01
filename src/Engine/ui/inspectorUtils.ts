// Utilities to build inspector metadata for components
// getInspector merges static metadata (constructor.inspector) and infers metadata for fields

import { Mat2, Mat3, Mat4, Quat, Vec2, Vec3, Vec4 } from "ts-gl-matrix";
import { Component } from "../ECS/Component";

function isImagePath(s: string) {
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(s);
}

function inferFromValue(v: any) {
    if (v == null) return undefined;
    const t = typeof v;
    if (t === 'number') {
        return { type: 'float' };
    }
    if (t === 'string') {
        if (isImagePath(v)) return { type: 'texture' };
        return { type: 'string' };
    }
    // handle instances from ts-gl-matrix (Vec2/3/4, Quat, Mat3/4 etc.) by constructor name

    if (v instanceof Vec2) return { type: 'vec2' };
    else if (v instanceof Vec3) return { type: 'vec3' };
    else if (v instanceof Vec4) return { type: 'vec4' };
    else if (v instanceof Quat) return { type: 'quat' };
    else if (v instanceof Mat2) return { type: 'mat2' };
    else if (v instanceof Mat3) return { type: 'mat3' };
    else if (v instanceof Mat4) return { type: 'mat4' };

    if (Array.isArray(v)) {
        const len = v.length;
        if (len === 2) return { type: 'vec2' };
        if (len === 3) return { type: 'vec3' };
        if (len === 4) return { type: 'vec4' };
        return { type: 'array' };
    }
    if (t === 'boolean') {
        return { type: 'boolean' };
    }
    if (t === 'object') {
        return { type: 'object', hidden: true };
    }
    return undefined;
}

export function getComponentMeta(component: Component): { [key: string]: any } {
    if (!component) return {};
    // component may be an instance or a constructor
    const constructor = (component as any).constructor || component;
    const staticMeta = constructor.inspector ?? {};
    console.log(component, 'staticMeta', staticMeta);


    const res: { [key: string]: any } = {};

    // get properties from instance
    const fields = Object.keys(component);

    // merge static meta and inferred
    for (const key of fields) {
        // static has priority
        if (staticMeta[key]) {
            res[key] = staticMeta[key];
            continue;
        }
        // infer from value if instance present
        const val = component[key as keyof Component];

        // if val is undefined but there's a getter method, try to call it safely
        if (!val) {
            const getterName = `get${key[0].toUpperCase()}${key.slice(1)}`;
            const func = (component as any)[getterName];
            if (typeof func === 'function') {
                try {
                    const got = func();
                    res[key] = inferFromValue(got) ?? { type: 'object' };
                } catch {
                    res[key] = undefined
                }
            } else {
                res[key] = undefined;
            }
        } else {
            res[key] = inferFromValue(val) ?? { type: 'object' };
        }
    }

    return res;
}

export function rgbToHex(rgb : {r : number, g: number, b: number}, alpha?: number): string {
    const r = rgb.r.toString(16).padStart(2, '0');
    const g = rgb.g.toString(16).padStart(2, '0');
    const b = rgb.b.toString(16).padStart(2, '0');
    if (!alpha) return `#${r}${g}${b}`;
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
}

export function hexToVec4(hex: string): Vec4 {
    const h = hex.replace('#', '');
    if (h.length !== 3 && h.length !== 4 && h.length !== 6 && h.length !== 8) return new Vec4(1, 1, 1, 1);

    let r = 1, g = 1, b = 1, a = 1;
    if (h.length === 3 || h.length === 4) {
        r = parseInt(h[0] + h[0], 16) / 255;
        g = parseInt(h[1] + h[1], 16) / 255;
        b = parseInt(h[2] + h[2], 16) / 255;
        if (h.length === 4) a = parseInt(h[3] + h[3], 16) / 255;
    } else if (h.length === 6 || h.length === 8) {
        r = parseInt(h.substring(0, 2), 16) / 255;
        g = parseInt(h.substring(2, 4), 16) / 255;
        b = parseInt(h.substring(4, 6), 16) / 255;
        if (h.length === 8) a = parseInt(h.substring(6, 8), 16) / 255;
    }
    return new Vec4(r, g, b, a);
}

export function hexToVec3(hex: string): Vec3 {
    const vec4 = hexToVec4(hex);
    return new Vec3(vec4.x, vec4.y, vec4.z);
}

// Conversion RGB (0-1) -> HSL (H: 0-360, S: 0-1, L: 0-1)
export function rgbToHsl(rgb: { r: number, g: number, b: number }): { h: number; s: number; l: number } {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const l = (max + min) / 2;
    const d = max - min;

    let s = 0;
    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                break;
            case g:
                h = ((b - r) / d + 2) * 60;
                break;
            case b:
                h = ((r - g) / d + 4) * 60;
                break;
        }
    }

    return { h, s, l };
}

// Conversion HSL (H: 0-360, S: 0-1, L: 0-1) -> RGB (0-1)
export function hslToRgb(hsl: { h: number; s: number; l: number }): { r: number; g: number; b: number } {
    const { h, s, l } = hsl;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));

    let r1 = 0, g1 = 0, b1 = 0;
    if (0 <= hp && hp < 1) [r1, g1, b1] = [c, x, 0];
    else if (1 <= hp && hp < 2) [r1, g1, b1] = [x, c, 0];
    else if (2 <= hp && hp < 3) [r1, g1, b1] = [0, c, x];
    else if (3 <= hp && hp < 4) [r1, g1, b1] = [0, x, c];
    else if (4 <= hp && hp < 5) [r1, g1, b1] = [x, 0, c];
    else if (5 <= hp && hp < 6) [r1, g1, b1] = [c, 0, x];

    const m = l - c / 2;
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);

    return { r, g, b };
}


export default getComponentMeta;
