import { defineConfig } from "vite";
import { resolve } from "path";
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dev: resolve(__dirname, "dev.html"),
      },
    },
    outDir: "dist", // le dossier de sortie
    emptyOutDir: true, // nettoie dist avant chaque build
  },
});