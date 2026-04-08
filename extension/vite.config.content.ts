import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

// Separate build for content.js — outputs a self-contained IIFE with no
// external imports, so Chrome can inject it as a classic content script
// without needing "type": "module" in the manifest.
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: false, // Don't wipe the main build output
    lib: {
      entry: resolve(__dirname, "src/content/index.ts"),
      name: "CadenceContent",
      formats: ["iife"],
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
