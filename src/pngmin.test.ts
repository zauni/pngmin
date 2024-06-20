import { copyFile } from "copy-file";
import grunt from "grunt";
import { strict as assert } from "node:assert";
import { readdir, stat } from "node:fs/promises";
import { before, describe, it } from "node:test";
import { rimraf } from "rimraf";
import type { Options } from "./utils.js";

async function runGruntTask(
  taskOptions:
    | {
        options: Partial<Options>;
        files: grunt.file.IFilesConfig[];
      }
    | {
        options: Partial<Options>;
        src: string;
        dest: string;
      },
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
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

    // We need to override `grunt.util.exit` to prevent the process from exiting in case of errors
    // @ts-expect-error `grunt.util.exit` is not in the type definition
    grunt.util.exit = (code: number) => {
      reject(new Error(`Grunt exited with code ${code}`));
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

  it("should support a different config structure", async () => {
    const log = await runGruntTask({
      options: {
        ext: ".png",
      },
      src: "src/fixtures/pngquant-logo.png",
      dest: "tmp/dest_test/pngquant-logo.png",
    });

    assert.match(log, /Optimized tmp(\/|\\)dest_test(\/|\\)pngquant-logo\.png/);
  });

  it("should handle non-existent files", async () => {
    const log = await runGruntTask({
      options: {
        ext: ".png",
      },
      files: [
        {
          src: ["src/nonexistent/path/*.png", "src/nonexistent/path2/*.png"],
          dest: "tmp/exists_test/",
        },
        {
          src: ["src/fixtures/pngquant-logo.png"],
          dest: "tmp/exists_test/",
        },
      ],
    });

    const images = await readdir("tmp/exists_test");

    assert.ok(images.length === 1, "1 image should be optimized.");
    assert.match(
      log,
      /Optimized tmp(\/|\\)exists_test(\/|\\)pngquant-logo\.png/,
    );
    assert.match(log, /No images were found in this path/);
  });

  it("should handle the quality option", async () => {
    await runGruntTask({
      options: {
        ext: "-qual1.png",
        quality: "65-80",
      },
      src: "src/fixtures/pngquant-logo.png",
      dest: "tmp/quality_test/",
    });
    await runGruntTask({
      options: {
        ext: "-qual2.png",
        quality: { min: 40, max: 60 },
      },
      src: "src/fixtures/pngquant-logo.png",
      dest: "tmp/quality_test/",
    });
    await runGruntTask({
      options: {
        ext: "-qual3.png",
        quality: [0, 20],
      },
      src: "src/fixtures/pngquant-logo.png",
      dest: "tmp/quality_test/",
    });

    const size1 = (await stat("tmp/quality_test/pngquant-logo-qual1.png")).size;
    const size2 = (await stat("tmp/quality_test/pngquant-logo-qual2.png")).size;
    const size3 = (await stat("tmp/quality_test/pngquant-logo-qual3.png")).size;

    assert.ok(size2 < size1, "File size should be bigger with quality 65-80.");
    assert.ok(size3 < size2, "File size should be bigger with quality 40-60.");
  });

  it("should retry the optimization without quality option", async () => {
    // This run fails in pngquant and we retry it without the quality option
    const log1 = await runGruntTask({
      options: {
        ext: "-qual4.png",
        quality: "100-100",
      },
      src: "src/fixtures/haustest.png",
      dest: "tmp/quality_test/",
    });
    // This run fails as well, but we don't retry it
    const log2 = await runGruntTask({
      options: {
        ext: "-qual5.png",
        quality: "100-100",
        retry: false,
        failOnError: false,
      },
      src: "src/fixtures/haustest.png",
      dest: "tmp/quality_test/",
    });

    assert.match(
      log1,
      /tmp(\/|\\)quality_test(\/|\\)haustest-qual4.png could not be optimized with quality option. Trying again without quality option!/,
    );
    assert.match(
      log1,
      /Optimized tmp(\/|\\)quality_test(\/|\\)haustest-qual4\.png/,
    );
    assert.match(
      log2,
      /Failed when running pngquant. ExecaError: Command failed with exit code 99/,
    );
  });

  it("should handle the nofs option", async () => {
    const log = await runGruntTask({
      options: {
        ext: ".png",
        nofs: true,
      },
      src: "src/fixtures/pngquant-logo.png",
      dest: "tmp/nofs_test/",
    });

    const actual = (await stat("tmp/nofs_test/pngquant-logo.png")).size;
    const expected = (
      await stat("src/fixtures/nofs_test/pngquant-logonofs.png")
    ).size;
    const original = (await stat("tmp/pngquant-logo-fs8.png")).size;

    assert.ok(
      Math.abs(actual - expected) <= 2000,
      `file should be roughly the same size as the fixture (+- 2 kb) but is ${Math.abs(actual - expected)}`,
    );
    assert.ok(
      actual < original,
      "with nofs option the file should be smaller than a normal minimized file",
    );
    assert.match(log, /Optimized tmp(\/|\\)nofs_test(\/|\\)pngquant-logo\.png/);
  });

  it('should handle the "failOnError" option', async () => {
    const log1 = await runGruntTask({
      options: {
        ext: ".png",
        failOnError: false,
      },
      src: "test/fixtures/not-an-image.png",
      dest: "tmp/should-not-work.png",
    });

    assert.match(log1, /No images were found/);
    assert.match(log1, /Done./);

    try {
      const log2 = await runGruntTask({
        options: {
          ext: "-fail.png",
          quality: "100-100",
          retry: false,
          failOnError: true,
        },
        src: "src/fixtures/haustest.png",
        dest: "tmp",
      });
      assert.ok(!log2, "There should be no log");
    } catch (error) {
      assert.ok(error);
    }
  });
});
