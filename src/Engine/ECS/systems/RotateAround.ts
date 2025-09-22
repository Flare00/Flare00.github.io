import type { ComponentManager } from "../Component";
import type { Entity } from "../Entity";
import { System } from "../System";

import { Transform } from "../components/Transform";
import { Vec3 } from "ts-gl-matrix";

export class RotateAround extends System {
    private mainEntity: Entity;
    private targetEntity: Entity;
    private radius: number;
    private azimuth: number; // en degrés, 0 = horizon
    private elevation: number; // en degrés, 0 = horizon, 90 = haut, -90 = bas
    private speed: number; // vitesse de rotation en degrés/seconde

    /**
     * @param mainEntity L'entité à faire tourner
     * @param targetEntity L'entité cible autour de laquelle tourner
     * @param radius Rayon de la rotation
     * @param azimuth Angle horizontal initial (en degrés)
     * @param elevation Angle vertical initial (en degrés)
     * @param speed Vitesse de rotation (en degrés/seconde)
     */
    constructor(
        mainEntity: Entity,
        targetEntity: Entity,
        radius: number = 5,
        azimuth: number = 0,
        elevation: number = 0,
        speed: number = 30
    ) {
        super();
        this.mainEntity = mainEntity;
        this.targetEntity = targetEntity;
        this.radius = radius;
        this.azimuth = azimuth;
        this.elevation = elevation;
        this.speed = speed;
    }

    update(dt: number, components: ComponentManager): void {
        // Avancer l'azimuth (rotation horizontale)
        this.azimuth += this.speed * dt;
        if (this.azimuth > 360) this.azimuth -= 360;
        if (this.azimuth < 0) this.azimuth += 360;

        // Récupérer les Transform
        const mainTransform = components.get(this.mainEntity, Transform);
        const targetTransform = components.get(this.targetEntity, Transform);
        if (!mainTransform || !targetTransform) return;

        // Position cible
        const targetPos = targetTransform.getPosition();

        // Conversion degrés -> radians
        const azimuthRad = (this.azimuth * Math.PI) / 180;
        const elevationRad = (this.elevation * Math.PI) / 180;

        // Calcul position sphérique
        const x = targetPos.x + this.radius * Math.cos(elevationRad) * Math.cos(azimuthRad);
        const y = targetPos.y + this.radius * Math.sin(elevationRad);
        const z = targetPos.z + this.radius * Math.cos(elevationRad) * Math.sin(azimuthRad);


        // Mettre à jour la position de l'entité principale
        mainTransform.setPosition(new Vec3(x, y, z));

        // LookAt la cible
        mainTransform.lookAt(targetPos);
    }
}