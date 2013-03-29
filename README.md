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

You also have to download pngquant from their website: (http://pngquant.org). Default the task will search for the binary in `bin` folder.

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

#### options.concurrency
Type: `Number`
Default value: `4`

How many executables will be spawned in parallel.

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

Should existing files be overwritten by the optimized version? Be careful with this option if you need the original files!

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
In this example `image.png` will be optimized, copied to `dest` folder and renamed to `image-fs8.png`.

```js
grunt.initConfig({
  pngmin: {
    compile: {
      options: {},
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
In this example `image.png` will be optimized and copied to `dest` folder.

```js
grunt.initConfig({
  pngmin: {
    compile: {
      options: {
        ext: '.png'
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

In this example `image.png` gets overwritten by the optimized version, so use force option carefully!

```js
grunt.initConfig({
  pngmin: {
    compile: {
      options: {
        ext: '.png',
        force: true
      },
      files: [
        {
          src: 'path/to/image.png',
          dest: 'path/to/'
        }
      ]
    }
  }
});
```

#### Example which is preserving the subfolder structure
In this example all images in the folder `path/to/images/` and its subfolders will be optimized and copied to `dest` while preserving the directory structure.
See http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically for more options.

```js
grunt.initConfig({
  pngmin: {
    compile: {
      options: {
        ext: '.png'
      },
      files: [
        {
          expand: true, // required option
          src: ['**/*.png'],
          cwd: 'path/to/images/', // required option
          dest: 'dest/'
        }
      ]
    }
  }
});
```

#### Complex example
This is a complex example with a lot of options set:

```js
grunt.initConfig({
  pngmin: {
    compile: {
      options: {
        binary: '/bin/pngquant', // specify pngquant path
        concurrency: 8,          // specify how many exucutables get spawned in parallel
        colors: 128,             // reduce colors to 128
        ext: '.png',             // use .png as extension for the optimized files
        speed: 10,               // pngquant should be as fast as possible
        iebug: true              // optimize image for use in Internet Explorer 6
      },
      files: [
        {
          src: 'path/to/images/*.png',
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
- 0.4.0: Destination doesn't have to be a directory anymore
- 0.3.4: If the `force` option is false and the file already exists at the destination pngquant doesn't get spawned
- 0.3.3: The total savings are displayed
- 0.3.2: The force option is no longer required if '.png' is set as ext option
- 0.3.1: If the optimization increases file size, the original file is copied to the destination
- 0.3.0: Corrected behaviour if files object is built dynamically (http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically)
- 0.2.1: Just one queue is created
- 0.2.0: The pngquant executable gets queued to avoid a problem with too many spawned executables
- 0.1.0: Initial release
