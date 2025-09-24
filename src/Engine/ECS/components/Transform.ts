import { Mat4, Quat, Vec3 } from "ts-gl-matrix";
import type { Component } from "../Component";

export class Transform implements Component {
    private position: Vec3 = new Vec3(0, 0, 0);
    private rotation: Quat = new Quat(0, 0, 0, 1);
    private scale: Vec3 = new Vec3(1, 1, 1);

    // private parent: Transform | null = null;
    // private children: Transform[] = [];


    constructor(/*parent?: Transform*/) {
        // if (parent != undefined) {
        //     this.setParent(parent);
        // }
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
        this.scale = scale;
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
    // setParent(parent: Transform | null): void {
    //     if (this.parent) {
    //         const idx = this.parent.children.indexOf(this);
    //         if (idx !== -1) this.parent.children.splice(idx, 1);
    //     }

    //     this.parent = parent;
    //     if (parent) parent.children.push(this);
    // }

    // addChild(child: Transform): void {
    //     child.setParent(this);
    // }

    // removeChild(child: Transform): void {
    //     child.setParent(null);
    // }

    // --- Matrices ---

    lookAt(target: Vec3, up: Vec3 = new Vec3(0, 1, 0)) {
        // Direction de la cible
        const dir = new Vec3();
        Vec3.subtract(dir, target, this.position);
        Vec3.normalize(dir, dir);

        // Calcul de la matrice lookAt
        const mat = new Mat4();
        Mat4.targetTo(mat, this.position, target, up);

        // Extraire la rotation de la matrice
        const rot = new Quat();
        Mat4.getRotation(rot, mat);
        this.rotation = rot;
    }
    getLocalMatrix(): Mat4 {
        const m = new Mat4();
        Mat4.fromRotationTranslationScale(m, this.rotation, this.position, this.scale);
        return m;
    }

    getViewMatrix(): Mat4 {
        const view = new Mat4();

        // On calcule la rotation inverse
        const invRot = new Quat();
        Quat.invert(invRot, this.rotation);

        // On calcule la position inverse (après rotation inverse)
        const invPos = new Vec3();
        Vec3.negate(invPos, this.position);
        Vec3.transformQuat(invPos, invPos, invRot);

        // Construire la viewMatrix
        Mat4.fromRotationTranslation(view, invRot, invPos);

        return view;
    }

    rotate(angleRad: number, axis: "x" | "y" | "z" | Vec3) {
        if(axis === "x") axis = new Vec3(1, 0, 0);
        if(axis === "y") axis = new Vec3(0, 1, 0);
        if(axis === "z") axis = new Vec3(0, 0, 1);
        const q = new Quat();
        Quat.setAxisAngle(q, axis, angleRad);
        Quat.multiply(this.rotation, q, this.rotation);
    }

    rotateX(angleRad: number) {
        this.rotate(angleRad, new Vec3(1, 0, 0));
    }

    rotateY(angleRad: number) {
        this.rotate(angleRad, new Vec3(0, 1, 0));
    }

    rotateZ(angleRad: number) {
        this.rotate(angleRad, new Vec3(0, 0, 1));
    }
}