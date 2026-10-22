import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built dist/ works from any path on a plain static host
// (root, subfolder, file://-ish CDN paths, etc.).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
