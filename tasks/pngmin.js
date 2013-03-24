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
        tmp  = require('tmp'),
        options;

    /**
     * Optimizes one picture
     * @param  {Object}   file     With src and dest properties
     * @param  {Function} callback Callback function
     */
    function optimize(file, callback) {
        var src = file.src,
            realDest = path.join(file.dest, path.basename(src, path.extname(src)) + options.ext);

        // optimize a temporary file
        tmp.tmpName({ postfix: '.png' }, function(error, tmpDest) {
            if(error) {
                callback(error);
                return;
            }

            grunt.file.copy(src, tmpDest);

            var args = [];

            if(options.iebug) { args.push('--iebug'); }
            if(options.transbug) { args.push('--transbug'); }

            args.push('--ext=.png', '--force', '--speed=' + options.speed, options.colors, '--', tmpDest);

            grunt.util.spawn({
                cmd: options.binary,
                args: args
            }, function(error, result, code) {
                if(error) {
                    callback(error);
                    return;
                }

                if(!options.force && grunt.file.exists(realDest)) {
                    grunt.log.writeln('Optimization skipped on ' + src.cyan + ' because it exists in destination. (force option is false!)');
                    callback();
                }

                var oldFile = grunt.file.read(src),
                    newFile = grunt.file.read(tmpDest),
                    savings = Math.floor((oldFile.length - newFile.length) / oldFile.length * 100);

                grunt.file.copy(tmpDest, realDest);
                grunt.file.delete(tmpDest, {force: true});

                if(savings >= 0) {
                    grunt.log.writeln('Optimized ' + src.cyan + ' -> ' + realDest.cyan + ' [saved ' + savings + ' %]');
                }
                else {
                    grunt.file.copy(src, realDest);
                    grunt.log.writeln('Optimization would increase file size by ' + (savings * -1) + ' % so optimization was skipped on file ' + src.yellow);
                }

                callback();
            });
        });
    }



    // pngmin multi task

    grunt.registerMultiTask('pngmin', 'Optimize png images with pngquant.', function() {
        var done = this.async(),
            queue;

        // Merge task-specific and/or target-specific options with these defaults.
        options = this.options({
            binary: 'bin/pngquant',
            concurrency: 4,
            colors: 256,
            ext: '-fs8.png',
            force: false,
            speed: 3,
            iebug: false,
            transbug: false
        });

        grunt.verbose.writeflags(options, 'Options');

        queue = grunt.util.async.queue(optimize, options.concurrency);

        queue.drain = function() {
            done();
        };

        // Iterate over all specified file groups.
        this.files.forEach(function(f) {
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
                    // if files object is built dynamically, the dest property isn't a directory
                    dest: f.orig.expand ? path.dirname(f.dest) : f.dest
                };
            });

            queue.push(files);
        });
    });

};
