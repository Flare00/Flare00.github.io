<template>
  <Inspector v-if="engine" class="floating" :engine="engine"></Inspector>
  <canvas id="glCanvas" style="width: 100vw; height: 100vh;"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import Inspector from '../Engine/ui/inspector/Inspector.vue';
import { Engine } from '../Engine/core/Engine';
import { MainScene } from '../MainScene';

const engine = ref<Engine | null>(null);

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

<style scoped>
.floating {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 420px;
  width: auto;
  pointer-events: auto;
}
</style>