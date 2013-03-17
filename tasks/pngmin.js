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
        options;

    /**
     * Optimizes one picture
     * @param  {Object}   file     With src and dest properties
     * @param  {Function} callback Callback function
     */
    function optimize(file, callback) {
        var dest = file.dest,
            src = file.src;

        if(!grunt.file.isDir(dest)) {
            grunt.file.mkdir(dest);
        }
        if(grunt.file.isDir(dest) && grunt.file.exists(dest)) {
            dest = path.join(dest, path.basename(src));

            grunt.file.copy(src, dest);

            var args = [
                    '--force',
                    '--ext=' + options.ext,
                    '--speed=' + options.speed
                ];

            if(options.iebug) { args.push('--iebug'); }
            if(options.transbug) { args.push('--transbug'); }

            args.push(options.colors, '--', dest);

            grunt.util.spawn({
                cmd: options.binary,
                args: args
            }, function(error, result, code) {
                if(error) {
                    callback(error);
                }
                else {
                    var oldFile = grunt.file.read(src),
                    newFile = grunt.file.read(dest),
                    savings = Math.floor(( oldFile.length - newFile.length ) / oldFile.length * 100 );

                    grunt.log.writeln('Optimized ' + src.cyan + ' -> ' + dest.cyan + ' [saved ' + savings + ' %]');

                    callback();
                }

            });
        }
    }

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('pngmin', 'Optimize png images with pngquant.', function() {
        var done = this.async(),
            iterator = 0,
            amount = this.files.length;

        // Merge task-specific and/or target-specific options with these defaults.
        options = this.options({
            binary: 'bin/pngquant',
            colors: 256,
            ext: '.png',
            speed: 3,
            iebug: false,
            transbug: false
        });

        grunt.verbose.writeflags(options, 'Options');

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
                    dest: f.dest
                };
            });

            grunt.util.async.forEach(files, optimize, function(err) {
                iterator++;
                if(iterator === amount) {
                    done(err);
                }
            });
        });
    });

};
