import { readFile } from "node:fs/promises";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const pkg = JSON.parse(await readFile("package.json", "utf8"));

/** @type {import('rollup').RollupOptions[]} */
export default [
  {
    input: "src/pngmin.ts",
    external: pkg.dependencies ? Object.keys(pkg.dependencies) : undefined,
    output: {
      file: "tasks/pngmin.cjs",
      format: "cjs",
      interop: "auto",
    },
    plugins: [resolve(), commonjs(), typescript()],
  },
];
