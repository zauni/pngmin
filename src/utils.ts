import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import copyFile from "cp-file";
import execa from "execa";
import { filesize } from "filesize";
import nodePngquantPath from "pngquant-bin";
import tmp, { type TmpNameCallback, type TmpNameOptions } from "tmp";
import which from "which";
import colors from "yoctocolors-cjs";

/**
 * Options for the task
 */
export type Options = {
  /** Should the whole grunt task fail in case of a pngquant failure */
  failOnError: boolean;
  /** Path to a pngquant binary */
  binary: string;
  /** How many pnquant executions should run concurrently */
  concurrency: number;
  /** Extension like '.png' */
  ext: string;
  /** Quality of the result: won't save below min, use fewer colors below max (0-100) */
  quality: null | string | { min: number; max: number } | number[];
  /** Should a existing destination file be overwritten */
  force: boolean;
  /** Speed/quality trade-off. 1=slow, 4=default, 11=fast & rough */
  speed: number;
  /** Enable workaround for IE6 */
  iebug: boolean;
  /** Should we retry a failed pngquant run (99 exit code) without quality option */
  retry: boolean;
  /** Disable Floyd-Steinberg dithering */
  nofs: boolean;
};

export type ImageFile = {
  /** Source path and filename */
  src: string;
  /** Destination path without filename */
  dest: string;
};

export type Logger = {
  writeln: (msg: string) => void;
  verbose: { writeln: (msg: string) => void };
};

const tmpName = promisify((options: TmpNameOptions, cb: TmpNameCallback) =>
  tmp.tmpName(options, cb),
);

/**
 * Get the path to the pngquant binary
 * Either from the node module or from the system
 */
export async function getBinPath(): Promise<string> {
  let pngquant = nodePngquantPath;
  if (!pngquant) {
    try {
      pngquant = await which("pngquant");
    } catch (err) {
      pngquant = "bin/pngquant";
    }
  }
  return pngquant;
}

/**
 * Runs pngquant binary
 *
 * It has these options:
 * ```
 * --force           overwrite existing output files (synonym: -f)
 * --skip-if-larger  only save converted files if they're smaller than original
 * --output file     destination file path to use instead of --ext (synonym: -o)
 * --ext new.png     set custom suffix/extension for output filenames
 * --quality min-max don't save below min, use fewer colors below max (0-100)
 * --speed N         speed/quality trade-off. 1=slow, 4=default, 11=fast & rough
 * --nofs            disable Floyd-Steinberg dithering
 * --posterize N     output lower-precision color (e.g. for ARGB4444 output)
 * --strip           remove optional metadata (default on Mac)
 * --verbose         print status messages (synonym: -v)
 * ```
 *
 * @param args Command line arguments
 * @param log Logger
 * @param options Options from the task
 */
export async function runPngquant(
  args: string[],
  log: Logger,
  options: Pick<Options, "binary">,
) {
  const pngquant = options.binary;

  log.verbose.writeln(
    `Trying to spawn "${pngquant}" with arguments: ${args.join(" ")}`,
  );

  return await execa(pngquant, args);
}

export type Savings = {
  savingsPercent: number;
  savingsSize: number;
};

const noSavings = { savingsPercent: 0, savingsSize: 0 };

export async function createTmpFile(): Promise<
  AsyncDisposable & { path: string }
> {
  const path = await tmpName({ postfix: ".png" });
  await fs.appendFile(path, "");

  return {
    path,
    async [Symbol.asyncDispose]() {
      await fs.unlink(path);
    },
  };
}

/**
 * Optimize an image file
 * @param file Image file to optimize
 * @param log Logger
 * @param options Options
 */
export async function optimizeImage(
  file: ImageFile,
  log: Logger,
  options: Options,
): Promise<Savings> {
  const src = file.src;
  const realDest = path.join(
    file.dest,
    path.basename(src, path.extname(src)) + options.ext,
  );
  let realDestExists = false;
  try {
    await fs.access(realDest, fs.constants.R_OK);
    realDestExists = true;
  } catch (error) {}

  if (realDestExists && !options.force) {
    log.writeln(
      `Optimization skipped on ${colors.cyan(src)} because it exists in destination. (force option is false!)`,
    );
    return noSavings;
  }

  await using temporaryFile = await createTmpFile();
  const tmpDest = temporaryFile.path;

  await copyFile(src, tmpDest);

  const args = createPngquantArgs(options, tmpDest);

  try {
    await runPngquant(args, log, options);
  } catch (err) {
    if (
      options.retry &&
      err instanceof Error &&
      "exitCode" in err &&
      err.exitCode === 99
    ) {
      log.writeln(
        `${colors.yellow(realDest)} could not be optimized with quality option. Trying again without quality option!`,
      );

      try {
        await runPngquant(
          args.filter((arg) => !arg.includes("--quality")),
          log,
          options,
        );
      } catch (innerErr) {
        throw new Error(
          `Failed when running pngquant after retrying. ${innerErr}`,
          {
            cause: innerErr,
          },
        );
      }
    } else {
      throw new Error(`Failed when running pngquant. ${err}`, {
        cause: err,
      });
    }
  }

  const oldFile = (await fs.stat(src)).size;
  const newFile = (await fs.stat(tmpDest)).size;
  const savings = Math.floor(((oldFile - newFile) / oldFile) * 100);

  if (savings > 0) {
    await copyFile(tmpDest, realDest);

    log.writeln(
      `Optimized ${colors.cyan(realDest)} [saved ${savings} % - ${filesize(oldFile)} → ${filesize(newFile)}]`,
    );

    return {
      savingsPercent: savings,
      savingsSize: oldFile - newFile,
    };
  }

  if (!realDestExists) {
    await copyFile(src, realDest);
  }

  log.writeln(
    `Optimization would increase file size by ${savings * -1} % so optimization was skipped on file ${realDest.yellow}`,
  );
  return noSavings;
}

export function createPngquantArgs(options: Options, dest: string): string[] {
  const args: string[] = [];
  const qual = options.quality;

  if (options.iebug) {
    args.push("--iebug");
  }
  if (options.nofs) {
    args.push("--nofs");
  }
  if (qual != null) {
    if (typeof qual === "string") {
      args.push(`--quality=${qual}`);
    }
    if (
      typeof qual === "object" &&
      !Array.isArray(qual) &&
      typeof qual.min === "number" &&
      typeof qual.max === "number"
    ) {
      args.push(`--quality=${qual.min}-${qual.max}`);
    } else if (
      Array.isArray(qual) &&
      typeof qual[0] === "number" &&
      typeof qual[1] === "number"
    ) {
      args.push(`--quality=${qual[0]}-${qual[1]}`);
    }
  }

  args.push("--ext=.png", "--force", `--speed=${options.speed}`, "--", dest);

  return args;
}
