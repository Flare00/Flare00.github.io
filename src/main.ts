import { Scene } from './Engine/core/Scene';
import { Engine } from './Engine/core/Engine';
import { ShaderProgram } from './Engine/rendering/ShaderProgram';
import { Material } from './Engine/ECS/components/Material';
import { Transform } from './Engine/ECS/components/Transform';
import { Vec3 } from 'ts-gl-matrix';
import { ShaderLoader } from './Engine/loaders/ShaderLoader';
import { ModelLoader } from './Engine/loaders/ModelLoader';
import { RenderSystem } from './Engine/ECS/systems/RenderSystem';
import type { System } from './Engine/ECS/System';
import { RotateAround } from './Engine/ECS/systems/RotateAround';

export async function StartEngine(canvas: HTMLCanvasElement) {

    console.log("Initializing Engine...")
    const engine = new Engine(canvas);

    console.log("Initializing Scene...")
    const scene = new Scene();

    const shader = new ShaderProgram(engine.glContext.gl, await ShaderLoader.LoadShaderFolder("/assets/shaders/pbr"));
    shader.set("u_lightDir", new Float32Array([0.5, 1, 0.5]));
    shader.set("u_lightColor", new Float32Array([1, 1, 1]));
    shader.set("u_albedo", new Float32Array([10, 0, 0]));
    shader.set("u_useAlbedoMap", 0);
    shader.set("u_metallic",0);
    shader.set("u_roughness",0);

    const cube = scene.createMesh(ModelLoader.generateCube(engine.glContext.gl, 1.5), new Material(shader));

    scene.getComponent(cube, Transform)!.setPosition(new Vec3(0,0,0));

    const camera = scene.createCamera();

    scene.setActiveCamera(camera);
    const camTransform = scene.getComponent(camera, Transform)!;
    camTransform.setPosition(new Vec3(2, 2, 2));
    camTransform.lookAt(new Vec3(0, 0, 0));

    scene.addSystem(new RenderSystem(engine));
    scene.addSystem(new RotateAround(camera, cube, 5, 45, 30, 20));


    engine.setScene(scene);
    console.log("Start engine...")
    engine.start();
    console.log("Engine started.")

}

let canvas = document.querySelector("#glCanvas");
console.log(canvas);
StartEngine(canvas as HTMLCanvasElement);