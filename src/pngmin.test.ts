import { copyFile } from "copy-file";
import grunt from "grunt";
import { strict as assert } from "node:assert";
import { readdir, stat } from "node:fs/promises";
import { before, describe, it } from "node:test";
import { rimraf } from "rimraf";
import type { Options } from "./utils.js";

async function runGruntTask(taskOptions: {
  options: Partial<Options>;
  files: grunt.file.IFilesConfig[];
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
          src: ["src/fixtures/pngquant-logo.png"],
          dest: "tmp/",
        },
      ],
    });

    const original = (await stat("src/fixtures/pngquant-logo.png")).size;
    const compressed = (await stat("tmp/pngquant-logo-fs8.png")).size;

    assert.ok(
      compressed < original,
      "File size should be smaller than before.",
    );
    assert.match(log, /Optimized tmp(\/|\\)pngquant-logo-fs8\.png/);
  });

  it("should optimize png images with a custom extension", async () => {
    const log = await runGruntTask({
      options: {
        ext: "-custom.png",
      },
      files: [
        {
          src: ["src/fixtures/pngquant-logo.png"],
          dest: "tmp/",
        },
      ],
    });

    assert.match(log, /Optimized tmp(\/|\\)pngquant-logo-custom\.png/);
  });

  it("should optimize png images with the force option", async () => {
    await copyFile(
      "src/fixtures/force_test/force1.png",
      "tmp/force/force1.png",
    );

    const log = await runGruntTask({
      options: {
        ext: ".png",
        force: true,
      },
      files: [
        {
          src: ["tmp/force/force1.png"],
          dest: "tmp/force/",
        },
      ],
    });

    const original = (await stat("src/fixtures/force_test/force1.png")).size;
    const compressed = (await stat("tmp/force/force1.png")).size;

    assert.ok(
      compressed < original,
      "File size should be smaller than before.",
    );

    assert.match(log, /Optimized tmp(\/|\\)force(\/|\\)force1\.png/);
  });

  it("should skip png images with the force option set to `false`", async () => {
    await copyFile(
      "src/fixtures/force_test/force2.png",
      "tmp/force/force2.png",
    );

    const log = await runGruntTask({
      options: {
        ext: ".png",
        force: false,
      },
      files: [
        {
          src: ["tmp/force/force2.png"],
          dest: "tmp/force/",
        },
      ],
    });

    const original = (await stat("src/fixtures/force_test/force2.png")).size;
    const compressed = (await stat("tmp/force/force2.png")).size;

    assert.ok(
      compressed === original,
      "File size should be the same as before.",
    );

    assert.match(
      log,
      /Optimization skipped on tmp(\/|\\)force(\/|\\)force2\.png/,
    );
  });

  it("should optimize multiple png images in a directory", async () => {
    const log = await runGruntTask({
      options: {
        ext: ".png",
      },
      files: [
        {
          src: ["src/fixtures/multiple/*.png"],
          dest: "tmp/multiple/",
        },
      ],
    });

    const images = await readdir("tmp/multiple");

    assert.ok(images.length === 10, "10 images should be optimized.");
    assert.match(
      log,
      /Optimized tmp(\/|\\)multiple(\/|\\)pngquant-logo-01\.png/,
    );
    assert.match(
      log,
      /Optimized tmp(\/|\\)multiple(\/|\\)pngquant-logo-02\.png/,
    );
    assert.match(
      log,
      /Optimized tmp(\/|\\)multiple(\/|\\)pngquant-logo-10\.png/,
    );
  });

  it("should optimize png images in a subdirectory", async () => {
    const log = await runGruntTask({
      options: {
        ext: ".png",
      },
      files: [
        {
          expand: true,
          src: ["**/*.png"],
          cwd: "src/fixtures/subdir_test/",
          dest: "tmp/subdir_test/",
        },
      ],
    });

    assert.match(
      log,
      /Optimized tmp(\/|\\)subdir_test(\/|\\)pngquant-logo\.png/,
    );
    assert.match(
      log,
      /Optimized tmp(\/|\\)subdir_test(\/|\\)subdir1(\/|\\)pngquant-logo\.png/,
    );
    assert.match(
      log,
      /Optimized tmp(\/|\\)subdir_test(\/|\\)subdir2(\/|\\)pngquant-logo\.png/,
    );
  });

  it("should skip images which would be bigger after optimization", async () => {
    const log = await runGruntTask({
      options: {
        ext: ".png",
      },
      files: [
        {
          src: ["src/fixtures/increase_test/*.png"],
          dest: "tmp/increase_test/",
        },
      ],
    });

    const originalSkipped = (
      await stat("src/fixtures/increase_test/glyphicons-halflings-white.png")
    ).size;
    const skipped = (
      await stat("tmp/increase_test/glyphicons-halflings-white.png")
    ).size;

    assert.ok(skipped === originalSkipped, "File size should be the same.");

    assert.match(
      log,
      /Optimization would increase file size by \d+ % so optimization was skipped on file tmp(\/|\\)increase_test(\/|\\)glyphicons-halflings-white\.png/,
    );
    assert.match(
      log,
      /Optimized tmp(\/|\\)increase_test(\/|\\)glyphicons-halflings\.png/,
    );
  });
});
