/*
 * grunt-pngmin
 * https://github.com/zauni/pngmin
 *
 * Copyright (c) 2013 Matthias Zaunseder
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>',
            ],
            options: {
                jshintrc: '.jshintrc',
            },
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp'],
        },

        // Copy images if necessary for the tests
        copy: {
            force_test: {
                files: [
                    {
                        expand: true,
                        src: '*.png',
                        cwd: 'test/fixtures/force_test/',
                        dest: 'tmp/force/',
                        flatten: true
                    }
                ]
            }
        },

        // Configuration to be run (and then tested).
        pngmin: {
            default_options: {
                options: {},
                files: [
                    {
                        src: 'test/fixtures/pngquant-logo.png',
                        dest: 'tmp/'
                    }
                ]
            },
            ext_test: {
                options: {
                    ext: '-custom.png'
                },
                files: [
                    {
                        src: 'test/fixtures/pngquant-logo.png',
                        dest: 'tmp/'
                    }
                ]
            },
            force_test: {
                options: {
                    ext: '.png',
                    force: true
                },
                files: [
                    {
                        src: 'tmp/force/force1.png',
                        dest: 'tmp/force/'
                    }
                ]
            },
            force_test2: {
                options: {
                    ext: '.png',
                    force: false
                },
                files: [
                    {
                        src: 'tmp/force/force2.png',
                        dest: 'tmp/force/'
                    }
                ]
            },
            multiple_test: {
                options: {
                    ext: '.png'
                },
                files: [
                    {
                        src: 'test/fixtures/multiple/*.png',
                        dest: 'tmp/multiple/'
                    }
                ]
            },
            subdir_test: {
                options: {
                    ext: '.png'
                },
                files: [
                    {
                        expand: true,
                        src: ['**/*.png'],
                        cwd: 'test/fixtures/subdir_test/',
                        dest: 'tmp/subdir_test/'
                    }
                ]
            },
            increase_test: {
                options: {
                    ext: '.png'
                },
                files: [
                    {
                        src: 'test/fixtures/increase_test/*.png',
                        dest: 'tmp/increase_test/'
                    }
                ]
            },
            dest_test: {
                options: {
                    ext: '.png'
                },
                src: 'test/fixtures/pngquant-logo.png',
                dest: 'tmp/dest_test/pngquant-logo.png'
            },
            exists_test: {
                options: {
                    ext: '.png'
                },
                files: [
                    {
                        src: ['test/nonexistent/path/*.png', 'test/nonexistent/path2/*.png'],
                        dest: 'tmp/exists_test/'
                    },
                    {
                        src: 'test/fixtures/pngquant-logo.png',
                        dest: 'tmp/exists_test/'
                    }
                ]
            },
            quality_test: {
                options: {
                    ext: '-qual1.png',
                    quality: '65-80'
                },
                src: 'test/fixtures/pngquant-logo.png',
                dest: 'tmp/quality_test/'
            },
            quality_test2: {
                options: {
                    ext: '-qual2.png',
                    quality: {min: 40, max: 60}
                },
                src: 'test/fixtures/pngquant-logo.png',
                dest: 'tmp/quality_test/'
            },
            quality_test3: {
                options: {
                    ext: '-qual3.png',
                    quality: [0, 20]
                },
                src: 'test/fixtures/pngquant-logo.png',
                dest: 'tmp/quality_test/'
            },
            quality_test4: {
                options: {
                    ext: '-qual4.png',
                    quality: '65-80'
                },
                src: 'test/fixtures/haustest.png',
                dest: 'tmp/quality_test/'
            },
            quality_test5: {
                options: {
                    ext: '-qual5.png',
                    quality: '65-80',
                    retry: false,

                    // This technically fails in pngquant, however it should NOT halt execution and proceed to subsequent tests. If it doesn't our unit tests should fail.
                    failOnError: false,
                },
                src: 'test/fixtures/haustest.png',
                dest: 'tmp/quality_test/'
            },
            nofs_test: {
                options: {
                    ext: '.png',
                    nofs: true
                },
                src: 'test/fixtures/pngquant-logo.png',
                dest: 'tmp/nofs_test/'
            },

            // Triggers an error in pngquant (since the image provided is actually a text file).
            error_test: {
                options: {
                    ext: '.png',
                    failOnError: true,
                },
                src: 'test/fixtures/not-an-image.png',
                dest: 'tmp/should-not-work.png'
            },
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js'],
        },

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // This task runs all pngmin tasks who can do it without the copy task
    // See the force_test task
    // IMPORTANT: The error tests are purposefully omitted because they're intended to fail. We need the other grunt tasks
    // to run in order to generate images that our unit tests can then analyze.
    grunt.registerTask('normalPngminTasks', [
        'pngmin:default_options',
        'pngmin:ext_test',
        'pngmin:multiple_test',
        'pngmin:subdir_test',
        'pngmin:increase_test',
        'pngmin:dest_test',
        'pngmin:exists_test',
        'pngmin:quality_test',
        'pngmin:quality_test2',
        'pngmin:quality_test3',
        'pngmin:quality_test4',
        'pngmin:quality_test5',
        'pngmin:nofs_test',
    ]);

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean', 'normalPngminTasks', 'copy:force_test', 'pngmin:force_test', 'pngmin:force_test2', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);

};
