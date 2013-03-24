/*
 * grunt-pngmin
 * https://github.com/zauni/pngmin
 *
 * Copyright (c) 2013 Matthias Zaunseder
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

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
            src: 'pngquant-logo.png',
            cwd: 'test/fixtures/',
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
            src: 'tmp/force/pngquant-logo.png',
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
      }
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
  grunt.registerTask('normalPngminTasks', [
    'pngmin:default_options',
    'pngmin:ext_test',
    'pngmin:multiple_test',
    'pngmin:subdir_test',
    'pngmin:increase_test'
  ]);

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'normalPngminTasks', 'copy:force_test', 'pngmin:force_test', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
