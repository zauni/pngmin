/*
 * grunt-pngmin
 * https://github.com/zauni/pngmin
 *
 * Copyright (c) 2013 Matthias Zaunseder
 * Licensed under the MIT license.
 */

import path from "node:path";
import chalk from "chalk";
import { filesize } from "filesize";
import pAll from "p-all";
import {
  type ImageFile,
  type Options,
  getBinPath,
  optimizeImage,
} from "./utils.js";

export default function (grunt: IGrunt) {
  grunt.registerMultiTask(
    "pngmin",
    "Optimize png images with pngquant.",
    async function () {
      const done = this.async();

      // Merge task-specific and/or target-specific options with these defaults.
      const options: Options = this.options({
        binary: await getBinPath(),
        concurrency: 4,
        ext: "-fs8.png",
        quality: null,
        force: false,
        speed: 3,
        iebug: false,
        retry: true,
        nofs: false,
        failOnError: true,
      } satisfies Options);

      grunt.log.verbose.writeflags(options);

      const fileQueue = this.files.flatMap((f): ImageFile[] => {
        let dest = f.dest;

        // if dest points to a file, or the files object is built dynamically
        // the dest property is transformed to a directory, because we expect that
        if (
          (dest && grunt.file.exists(dest) && grunt.file.isFile(dest)) ||
          (dest && path.extname(dest) === ".png") ||
          // @ts-expect-error `orig.expand` is not in the type definition and could be used by older grunt versions
          f.orig.expand
        ) {
          dest = path.dirname(dest ?? "");
        }

        // Concat specified files.
        const files: ImageFile[] = (f.src ?? [])
          .filter((filepath) => {
            // Warn on and remove invalid source files (if nonull was set).
            if (!grunt.file.exists(filepath)) {
              grunt.log.warn(`Source file "${filepath}" not found.`);
              return false;
            }
            return true;
          })
          .map((filepath) => ({
            src: filepath,
            dest: dest ?? filepath,
          }));

        if (files.length === 0) {
          grunt.log.writeln(
            `No images were found in this path(s): ${chalk.cyan((f.src ?? []).join(", "))}`,
          );
        }

        return files;
      });

      if (fileQueue.length === 0) {
        grunt.log.verbose.writeln("No images were found at all...");
        done();
        return;
      }

      try {
        const results = await pAll(
          fileQueue.map(
            (file) => () => optimizeImage(file, grunt.log, options),
          ),
          { concurrency: options.concurrency, stopOnError: false },
        );

        let totalSize = 0;
        let totalPercent = 0;

        for (const result of results) {
          totalPercent += result.savingsPercent;
          totalSize += result.savingsSize;
        }

        const avg =
          results.length > 0 ? Math.floor(totalPercent / results.length) : 0;

        grunt.log.writeln(
          `Overall savings: ${chalk.green(`${avg} %`)} | ${chalk.green(filesize(totalSize))}`,
        );
      } catch (error) {
        if (error instanceof AggregateError) {
          for (const e of error.errors) {
            grunt.log.error(`Aggregated error: ${e}`);
          }
        } else {
          grunt.log.error(`${error}`);
        }

        if (options.failOnError) {
          done(error);
          return;
        }
      }

      done();
    },
  );
}
