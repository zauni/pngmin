'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.pngmin = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  default_options: function(test) {
    test.expect(2);

    var actual = grunt.file.read('tmp/pngquant-logo-fs8.png');
    var expected = grunt.file.read('test/expected/pngquant-logo-fs8.png');
    test.equal(actual.length, expected.length, 'should be the same size as the test file.');

    test.ok(!grunt.file.exists('tmp/pngquant-logo.png'));

    test.done();
  },
  ext_test: function(test) {
    test.expect(2);

    var actual = grunt.file.read('tmp/pngquant-logo-custom.png');
    var expected = grunt.file.read('test/expected/pngquant-logo-fs8.png');
    test.equal(actual, expected, 'sould be the same size as the test file.');

    test.ok(!grunt.file.exists('tmp/pngquant-logo.png'));

    test.done();
  },
  force_test: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/force/pngquant-logo.png');
    var expected = grunt.file.read('test/expected/pngquant-logo-fs8.png');
    test.equal(actual, expected, 'sould be the same size as the test file.');

    test.done();
  },
  multiple_test: function(test) {
    test.expect(1);

    var actual = grunt.file.expand('tmp/multiple/*.png');
    var expected = 10;
    test.equal(actual.length, expected, 'should be 10 images');

    test.done();
  }
};
