import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Cockpit dev server. Visuals are placeholder until the prototype lands;
// the point of this slice is the real data + interaction model.
export default defineConfig({
  // Relative base so a GitHub Pages build works at username.github.io/<repo>/.
  base: "./",
  plugins: [react()],
  server: { port: 5173, host: true },
});
