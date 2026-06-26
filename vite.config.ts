import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite builds the React frontend in src/ into dist/, which server.ts serves
// statically at runtime under DollarDeploy.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
