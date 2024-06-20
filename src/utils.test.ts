import { strict as assert } from "node:assert";
import { stat } from "node:fs/promises";
import { describe, it } from "node:test";
import {
  type Options,
  createPngquantArgs,
  createTmpFile,
  getBinPath,
  optimizeImage,
  runPngquant,
} from "./utils.js";

describe("utils", () => {
  it("should get the correct pngquant executable path", async () => {
    const binPath = await getBinPath();
    assert.ok(binPath);
  });

  it("should spawn the pngquant executable but without files", async () => {
    const log = {
      writeln: () => {},
      verbose: { writeln: () => {} },
    };
    await assert.rejects(
      runPngquant(["--verbose"], log, { binary: await getBinPath() }),
      {
        message: /No input files specified./,
      },
    );
  });

  it("should optimize an image file", async () => {
    const log = {
      writeln: () => {},
      verbose: { writeln: () => {} },
    };
    const options = {
      binary: await getBinPath(),
      concurrency: 4,
      ext: "-fs8.png",
      quality: null,
      force: true,
      speed: 3,
      iebug: false,
      retry: true,
      nofs: false,
      failOnError: false,
    };
    const file = {
      src: "src/fixtures/pngquant-logo.png",
      dest: "tmp/dest_test",
    };
    const savings = await optimizeImage(file, log, options);
    assert.ok(savings.savingsPercent);
    assert.ok(savings.savingsSize);
  });

  it("should create and automatically delete a temporary file", async () => {
    let path = "";
    {
      await using tmpFile = await createTmpFile();
      assert.ok(tmpFile.path);
      const tmpFileExists = await stat(tmpFile.path);
      assert.ok(tmpFileExists);
      path = tmpFile.path;
    }

    await stat(path).catch((error) => {
      assert.strictEqual(error.code, "ENOENT");
    });
  });

  describe("createPngquantArgs", () => {
    it("should handle default options", () => {
      const options = {
        failOnError: false,
        binary: "",
        concurrency: 1,
        ext: "",
        quality: null,
        force: false,
        speed: 4,
        iebug: false,
        retry: false,
        nofs: false,
      } satisfies Options;
      const args = createPngquantArgs(options, "output.png");
      assert.deepStrictEqual(args, [
        "--ext=.png",
        "--force",
        "--speed=4",
        "--",
        "output.png",
      ]);
    });

    it("should handle all options", () => {
      const options = {
        failOnError: false,
        binary: "",
        concurrency: 1,
        ext: ".jpg",
        quality: { min: 20, max: 80 },
        force: true,
        speed: 2,
        iebug: true,
        retry: false,
        nofs: true,
      } satisfies Options;
      const args = createPngquantArgs(options, "output.jpg");
      assert.deepStrictEqual(args, [
        "--iebug",
        "--nofs",
        "--quality=20-80",
        "--ext=.png",
        "--force",
        "--speed=2",
        "--",
        "output.jpg",
      ]);
    });

    it("should handle quality as string", () => {
      const options = {
        failOnError: false,
        binary: "",
        concurrency: 1,
        ext: "",
        quality: "50-70",
        force: true,
        speed: 2,
        iebug: false,
        retry: false,
        nofs: false,
      } satisfies Options;
      const args = createPngquantArgs(options, "output.png");
      assert.deepStrictEqual(args, [
        "--quality=50-70",
        "--ext=.png",
        "--force",
        "--speed=2",
        "--",
        "output.png",
      ]);
    });

    it("should handle quality as array", () => {
      const options = {
        failOnError: false,
        binary: "",
        concurrency: 1,
        ext: "",
        quality: [10, 90],
        force: true,
        speed: 2,
        iebug: false,
        retry: false,
        nofs: false,
      } satisfies Options;
      const args = createPngquantArgs(options, "output.png");
      assert.deepStrictEqual(args, [
        "--quality=10-90",
        "--ext=.png",
        "--force",
        "--speed=2",
        "--",
        "output.png",
      ]);
    });

    it("should handle iebug and nofs options", () => {
      const options = {
        failOnError: false,
        binary: "",
        concurrency: 1,
        ext: "",
        quality: null,
        force: true,
        speed: 3,
        iebug: true,
        retry: false,
        nofs: true,
      } satisfies Options;
      const args = createPngquantArgs(options, "output.png");
      assert.deepStrictEqual(args, [
        "--iebug",
        "--nofs",
        "--ext=.png",
        "--force",
        "--speed=3",
        "--",
        "output.png",
      ]);
    });
  });
});
