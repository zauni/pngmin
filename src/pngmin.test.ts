import grunt from "grunt";
import { before, describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { rimraf } from "rimraf";
import type { Options } from "./utils.js";

async function runGruntTask(taskOptions: {
  options: Partial<Options>;
  files: { src: string; dest: string }[];
}): Promise<string> {
  return new Promise<string>((resolve) => {
    // @ts-expect-error `grunt.task.init` is not in the type definition
    grunt.task.init = () => {};
    grunt.loadTasks("tasks");
    grunt.initConfig({
      pngmin: {
        taskOptions,
      },
    });
    assert.ok(grunt.task.exists("pngmin"));

    const logs: string[] = [];
    // @ts-expect-error is not in the type definition
    grunt.log.options.outStream = {
      write: (str: string) => {
        logs.push(str);
      },
    };

    // @ts-expect-error `grunt.tasks()` is not in the type definition
    grunt.tasks(["pngmin:taskOptions"], { verbose: true, color: false }, () => {
      resolve(logs.join(""));
    });
  });
}

describe("pngmin", () => {
  before(async () => {
    await rimraf("tmp");
  });

  it("should optimize png images with default options", async () => {
    const log = await runGruntTask({
      options: {},
      files: [
        {
          src: "src/fixtures/pngquant-logo.png",
          dest: "tmp/",
        },
      ],
    });

    assert.match(log, /Optimized tmp(\/|\\)pngquant-logo-fs8\.png/);
  });

  it("should optimize png images with a custom extension", async () => {
    const log = await runGruntTask({
      options: {
        ext: "-custom.png",
      },
      files: [
        {
          src: "src/fixtures/pngquant-logo.png",
          dest: "tmp/",
        },
      ],
    });

    assert.match(log, /Optimized tmp(\/|\\)pngquant-logo-custom\.png/);
  });
});
