import './style.css'

import { Scene } from './Engine/core/Scene';
import { Engine } from './Engine/core/Engine';
import { Camera } from './Engine/ECS/components/Camera';
import { ShaderProgram } from './Engine/rendering/ShaderProgram';
import { Material } from './Engine/ECS/components/Material';
import { Transform } from './Engine/ECS/components/Transform';
import { Vec3 } from 'ts-gl-matrix';
import { ShaderLoader } from './Engine/loaders/ShaderLoader';
import { ModelLoader } from './Engine/loaders/ModelLoader';



export function StartEngine(canvas: HTMLCanvasElement) {

    console.log("Starting engine...")
    const engine = new Engine(canvas);
    const scene = new Scene();
    engine.setScene(scene);

    const cameraEntity = scene.ecs.createCamera();
    scene.setMainCamera(scene.ecs.components.get(cameraEntity, Camera)!);

    const shader = new ShaderProgram(engine.glContext.gl, ShaderLoader.stdVertexShader(), ShaderLoader.stdFragmentShader());

    const cube = scene.ecs.createMesh(ModelLoader.generateTriangle(engine.glContext.gl), new Material(shader));
    scene.ecs.components.get(cube, Transform)!.setPosition(new Vec3(0, 0, 0));

    engine.start();
}

// let canvas = document.querySelector("#glCanvas");

// StartEngine(canvas!);