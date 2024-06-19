import grunt from "grunt";
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

describe("pngmin", () => {
  it("should optimize png images with pngquant", async () => {
    // @ts-expect-error `grunt.task.init` is not in the type definition
    grunt.task.init = () => {};
    grunt.loadTasks("tasks");
    grunt.initConfig({
      pngmin: {
        default_options: {
          options: {},
          files: [
            {
              src: "src/fixtures/pngquant-logo.png",
              dest: "foo2/",
            },
          ],
        },
      },
    });
    assert.ok(grunt.task.exists("pngmin"));

    // grunt.log.muted = true;

    // @ts-expect-error `grunt.tasks()` is not in the type definition
    grunt.tasks(["pngmin:default_options"], { verbose: true }, () => {
      console.log("RAN THE TASK!!!");

      // console.log(grunt.log._messages);
    });
    // grunt.task.run("pngmin:default_options");
  });
});
