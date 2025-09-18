import { Mat4, Quat, Vec3 } from "ts-gl-matrix";
import type { Component } from "../Component";

export class Transform implements Component {
    private position: Vec3 = new Vec3(0, 0, 0);
    private rotation: Quat = new Quat(0, 0, 0, 1);
    private scale: Vec3 = new Vec3(1, 1, 1);

    private parent: Transform | null = null;
    private children: Transform[] = [];


    constructor(parent?: Transform) {
        if (parent != undefined) {
            this.setParent(parent);
        }
    }
    // --- Setters ---
    setPosition(position: Vec3) {
        this.position = position;
    }

    setRotationQuat(rotation: Quat) {
        this.rotation = rotation;
    }

    setRotationEuler(euler: Vec3) {
        Quat.fromEuler(this.rotation, euler.x, euler.y, euler.z);
    }

    setScale(scale: Vec3) {
        this.position = scale;
    }

    // --- Getters ---

    getPosition(): Vec3 {
        return this.position;
    }

    getRotation(): Quat {
        return this.rotation;
    }

    getRotationEuler(): Vec3 {
        return this.toEulerXYZ(this.rotation);
    }

    private toEulerXYZ(q: Quat): Vec3 {
        const wx = q.w * q.x,
            wy = q.w * q.y,
            wz = q.w * q.z;
        const xx = q.x * q.x,
            xy = q.x * q.y,
            xz = q.x * q.z;
        const yy = q.y * q.y,
            yz = q.y * q.z,
            zz = q.z * q.z;

        return new Vec3(
            (-Math.atan2(2 * (yz - wx), 1 - 2 * (xx + yy)) * 180) / Math.PI,
            (Math.asin(2 * (xz + wy)) * 180) / Math.PI,
            (-Math.atan2(2 * (xy - wz), 1 - 2 * (yy + zz)) * 180) / Math.PI,
        );
    }


    getScale(): Vec3 {
        return this.scale;
    }

    // --- Hierarchy ---
    setParent(parent: Transform | null): void {
        if (this.parent) {
            const idx = this.parent.children.indexOf(this);
            if (idx !== -1) this.parent.children.splice(idx, 1);
        }

        this.parent = parent;
        if (parent) parent.children.push(this);
    }

    addChild(child: Transform): void {
        child.setParent(this);
    }

    removeChild(child: Transform): void {
        child.setParent(null);
    }

    // --- Matrices ---
    getLocalMatrix(): Mat4 {
        const m = new Mat4();
        Mat4.fromRotationTranslationScale(m, this.rotation, this.position, this.scale);
        return m;
    }

    getGlobalMatrix(): Mat4 {
        const local = this.getLocalMatrix();
        if (this.parent) {
            const parentGlobal = this.parent.getGlobalMatrix();
            return Mat4.multiply(new Mat4(), parentGlobal, local) as Mat4;
        }
        return local;
    }
}