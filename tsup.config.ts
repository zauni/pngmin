import { readFile } from "node:fs/promises";
import { defineConfig } from "tsup";

const pkg = JSON.parse(await readFile("package.json", "utf8"));

export default defineConfig({
  entry: {
    pngmin: "./src/cjs-wrapper.cts",
  },
  clean: true,
  format: ["cjs"],
  target: "node12",
  platform: "node",
  external: pkg.dependencies ? Object.keys(pkg.dependencies) : undefined,
  outDir: "tasks",
});
