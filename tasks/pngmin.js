/*
 * grunt-pngmin
 * https://github.com/zauni/pngmin
 *
 * Copyright (c) 2013 Matthias Zaunseder
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var path = require('path'),
        fs   = require('fs'),
        tmp  = require('tmp'),
        filesize = require('filesize'),
        which = require('which'),
        nodePngquantPath = require('pngquant-bin'),
        _ = grunt.util._,
        totalPercent,
        totalSize,
        options;

    /**
     * Runs pngquant binary
     * @param  {Array}   args      Command line arguments
     * @param  {Function} callback Callback
     */
    function runPngquant(args, callback) {
        grunt.log.debug('Trying to spawn "' + options.binary + '" with arguments: ');
        grunt.log.debug(args.join(' '));
        grunt.util.spawn({
            cmd: options.binary,
            args: args
        }, callback);
    }

    /**
     * Optimizes one picture
     * @param  {Object}   file     With src and dest properties
     * @param  {Function} callback Callback function
     */
    function optimize(file, callback) {
        var src = file.src,
            realDest = path.join(file.dest, path.basename(src, path.extname(src)) + options.ext),
            realDestExists = grunt.file.exists(realDest);

        if(realDestExists && !options.force) {
            grunt.log.writeln('Optimization skipped on ' + src.cyan + ' because it exists in destination. (force option is false!)');
            totalPercent.push(0);
            callback();
            return;
        }

        // optimize a temporary file
        tmp.tmpName({ postfix: '.png' }, function(error, tmpDest) {
            if(error) {
                callback(error);
                totalPercent.push(0);
                return;
            }

            grunt.file.copy(src, tmpDest);

            var args = [],
                qual = options.quality,
                tries = 1;

            if(options.iebug) { args.push('--iebug'); }
            if(qual != null) {
                if(_.isString(qual)) {
                    args.push('--quality=' + qual);
                }
                else if(_.isObject(qual) && _.isNumber(qual.min) && _.isNumber(qual.max)) {
                    args.push('--quality=' + qual.min + '-' + qual.max);
                }
                else if(_.isArray(qual) && _.isNumber(qual[0]) && _.isNumber(qual[1])) {
                    args.push('--quality=' + qual[0] + '-' + qual[1]);
                }
            }

            args.push('--ext=.png', '--force', '--speed=' + options.speed, '--', tmpDest);

            var cb = function(error, result, code) {
                if(options.retry && error && code === 99 && tries === 1) {
                    args = _.filter(args, function(arg) {
                        if(_.isString(arg) && arg.indexOf('--quality') === 0) {
                            return false;
                        }
                        return true;
                    });
                    tries++;
                    grunt.log.writeln(realDest.yellow + ' could not be optimized with quality option. Trying again without quality option!');
                    runPngquant(args, cb);
                    return;
                }

                if(error) {
                    callback(error);
                    totalPercent.push(0);
                    return;
                }

                var oldFile = fs.statSync(src).size,
                    newFile = fs.statSync(tmpDest).size,
                    savings = Math.floor((oldFile - newFile) / oldFile * 100);

                if(savings > 0) {
                    grunt.file.copy(tmpDest, realDest);

                    grunt.log.writeln('Optimized ' + realDest.cyan +
                                      ' [saved ' + savings + ' % - ' + filesize(oldFile) + ' → ' + filesize(newFile) + ']');
                    totalPercent.push(savings);
                    totalSize += oldFile - newFile;
                }
                else {
                    if(!realDestExists) {
                        grunt.file.copy(src, realDest);
                    }

                    grunt.log.writeln('Optimization would increase file size by ' + (savings * -1) + ' % so optimization was skipped on file ' + realDest.yellow);
                    totalPercent.push(0);
                }

                grunt.file.delete(tmpDest, {force: true});

                callback();
            };

            runPngquant(args, cb);
        });
    }



    // pngmin multi task

    grunt.registerMultiTask('pngmin', 'Optimize png images with pngquant.', function() {
        var done = this.async(),
            queue,
            pngquant;

        if(nodePngquantPath === null) {
            try {
                pngquant = which.sync('pngquant');
            } catch(ex) {
                pngquant = 'bin/pngquant';
            }
        }
        else {
            pngquant = nodePngquantPath;
        }

        // Merge task-specific and/or target-specific options with these defaults.
        options = this.options({
            binary: pngquant,
            concurrency: 4,
            ext: '-fs8.png',
            quality: null,
            force: false,
            speed: 3,
            iebug: false,
            retry: true
        });

        // reset
        totalPercent = [];
        totalSize = 0;

        grunt.verbose.writeflags(options, 'Options');

        // every file will be pushed in this queue
        queue = grunt.util.async.queue(optimize, options.concurrency);

        queue.drain = function() {
            var sum = totalPercent.reduce(function(a, b) { return a + b; }, 0),
                avg = totalPercent.length > 0 ? Math.floor(sum / totalPercent.length) : 0;

            grunt.log.writeln('Overall savings: ' + (avg + ' %').green + ' | ' + filesize(totalSize).green);
            done();
        };

        // Iterate over all specified file groups.
        this.files.forEach(function(f) {
            var dest = f.dest;

            // if dest points to a file, or the files object is built dynamically
            // the dest property is transformed to a directory, because we expect that
            if(
                (grunt.file.exists(f.dest) && grunt.file.isFile(f.dest)) ||
                path.extname(f.dest) === '.png' ||
                f.orig.expand
            ) {
                dest = path.dirname(f.dest);
            }

            // Concat specified files.
            var files = f.src.filter(function(filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                }
                else {
                    return true;
                }
            }).map(function(filepath) {
                return {
                    src: filepath,
                    dest: dest
                };
            });

            if(files.length === 0) {
                grunt.log.writeln('No images were found in this path(s): ' + f.orig.src.join(', ').cyan);
            }

            queue.push(files);
        });

        if(queue.length() === 0) {
            grunt.verbose.writeln('No images were found at all...');
            done();
        }
    });

};
