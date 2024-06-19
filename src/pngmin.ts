/*
 * grunt-pngmin
 * https://github.com/zauni/pngmin
 *
 * Copyright (c) 2013 Matthias Zaunseder
 * Licensed under the MIT license.
 */

import { filesize } from "filesize";
import path from "node:path";
import pLimit from "p-limit";
import {
  getBinPath,
  optimizeImage,
  type ImageFile,
  type Options,
} from "./utils.js";
import chalk from "chalk";

export default function (grunt: IGrunt) {
  grunt.registerMultiTask(
    "pngmin",
    "Optimize png images with pngquant.",
    async function () {
      const done = this.async();

      console.log("binPath", await getBinPath());

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
        failOnError: false,
      } satisfies Options);

      grunt.log.verbose.writeflags(options);

      const limit = pLimit(options.concurrency);

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
        const results = await Promise.all(
          fileQueue.map((file) =>
            limit(() => optimizeImage(file, grunt.log, options)),
          ),
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
        if (options.failOnError) {
          throw grunt.util.error(
            `${error} Please use --stack for details.`,
            error instanceof Error ? error : undefined,
          );
        }
        grunt.log.error(`${error}`);
      }

      done();
    },
  );
}
