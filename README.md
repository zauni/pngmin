# grunt-pngmin

> Grunt plugin to compress png images with pngquant.

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-pngmin --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-pngmin');
```

## The "pngmin" task

### Overview
In your project's Gruntfile, add a section named `pngmin` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  pngmin: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.binary
Type: `String`
Default value: `'bin/pngquant'`

The pngquant executable which will be spawned.

#### options.colors
Type: `Number`
Default value: `256`

How many colors should be in the image after quantizing.

#### options.ext
Type: `String`
Default value: `'-fs8.png'`

The file extension after the quantization.

#### options.force
Type: `Boolean`
Default value: `false`

Should existing files be overwritten? If you set the ext option to `'.png'` you have to set the force option to `true`.

#### options.speed
Type: `Number`
Default value: `3`

Speed/quality trade-off from 1 (brute-force) to 10 (fastest). Speed 10 has 5% lower quality, but is 8 times faster than the default.

#### options.iebug
Type: `Boolean`
Default value: `false`

Workaround for IE6, which only displays fully opaque pixels. pngquant will make almost-opaque pixels fully opaque and will avoid creating new transparent colors.

#### options.transbug
Type: `Boolean`
Default value: `false`

Transparent color will be placed at the end of the palette.

### Usage Examples

#### Default Options
In this example the `image.png` will be copied to `dest` folder and gets optimized and renamed to `image-fs8.png`.

```js
grunt.initConfig({
  pngmin: {
    default_options: {
      options: {
      },
      files: [
        {
          src: 'path/to/image.png',
          dest: 'dest/'
        }
      ]
    }
  }
});
```

#### Custom Options
In this example the `image.png` will be copied to `dest` folder and gets optimized and renamed to `image-custom.png`.

```js
grunt.initConfig({
  pngmin: {
    default_options: {
      options: {
        ext: '-custom.png'
      },
      files: [
        {
          src: 'path/to/image.png',
          dest: 'dest/'
        }
      ]
    }
  }
});
```

In this example the `image.png` will be copied to `dest` folder and gets optimized and will not be renamed!

```js
grunt.initConfig({
  pngmin: {
    default_options: {
      options: {
        ext: '.png',
        force: true
      },
      files: [
        {
          src: 'path/to/image.png',
          dest: 'dest/'
        }
      ]
    }
  }
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
- 0.1.0: Initial release
