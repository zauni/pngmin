import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

/** @type {import('rollup').RollupOptions[]} */
export default [
  {
    input: "src/pngmin.ts",
    external: [
      "chalk",
      "copy-file",
      "execa",
      "filesize",
      "p-limit",
      "pngquant-bin",
      "tmp",
      "which",
    ],
    output: {
      file: "tasks/pngmin.cjs",
      format: "cjs",
      interop: "auto",
    },
    plugins: [resolve(), commonjs(), typescript()],
  },
];
