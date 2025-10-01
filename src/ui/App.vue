<template>
  <div class="h-screen overflow-hidden ">
    <canvas id="glCanvas" class="w-full h-full"></canvas>
    <EngineInterface v-if="engine" class="w-0 h-0" :engine="engine"></EngineInterface>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { Engine } from '../Engine/core/Engine';
import { MainScene } from '../MainScene';
import EngineInterface from '../Engine/ui/EngineInterface.vue';

const engine = ref<Engine>();
async function start() {
  let canvas = document.querySelector("#glCanvas");
  engine.value = await Engine.StartEngine(canvas as HTMLCanvasElement, new MainScene());

  // Expose engine globally so the Vue inspector can access it
  (window as any).engine = engine;

  // Inject the inspector stylesheet if available — the Vue inspector will mount itself when present
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/inspector.css';
  document.head.appendChild(link);
}

onMounted(() => {
  start();
});

</script>