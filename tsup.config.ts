import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    pngmin: "./src/cjs-wrapper.cts",
  },
  clean: true,
  format: ["cjs"],
  target: "node12",
  platform: "node",
  outDir: "tasks",
});
