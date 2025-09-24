import { Engine } from './Engine/core/Engine';
import { MainScene } from './MainScene';

let canvas = document.querySelector("#glCanvas");
Engine.StartEngine(canvas as HTMLCanvasElement, new MainScene());