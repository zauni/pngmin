import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { getBinPath, optimizeImage, runPngquant } from "./utils.js";

describe("utils", () => {
  it("should get the correct pngquant executable path", async () => {
    const binPath = await getBinPath();
    console.log("binPath", binPath);
    assert.ok(binPath);
  });

  it("should spawn the pngquant executable but without files", async () => {
    const log = {
      writeln: () => {},
    };
    await assert.rejects(
      runPngquant(["--verbose"], log, { binary: await getBinPath() }),
      {
        name: "ExecaError",
        message: /No input files specified./,
      },
    );
  });

  it("should optimize an image file", async () => {
    const log = {
      writeln: () => {},
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
});
