import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
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