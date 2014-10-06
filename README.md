# grunt-pngmin

> Grunt plugin to compress png images with pngquant.

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-pngmin --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-pngmin');
```

### Linux users
You also have to download pngquant if you are on a Linux system from their website: [pngquant.org](http://pngquant.org).
You can put the pngquant executable either somewhere in your `PATH` or in a folder in your project.
If you put it in a folder outside of the `PATH`, you have to specify the path to it with the `binary` option (see below).

If you don't do this, you will see this error:
~~~
Warning: Running "pngmin:dist" (pngmin) task
Fatal error: spawn ENOENT
~~~

Windows and Mac OSX is supported out of the box.

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
Default value: `'pngquant'` in your `PATH` or `'bin/pngquant'`

Important for Linux users!
The pngquant executable which will be spawned. If the pngquant binary is not found in `PATH` the default fallback is `'bin/pngquant'`, but this option has always precedence.

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

#### options.quality
Type: `String`, `Object` or `Array`
Default value: `null`

Instructs pngquant to use the least amount of colors required to meet or exceed the max quality.
If conversion results in quality below the min quality the image won't be saved.
Specify quality like that:
* String: `'min-max'`
* Object: `{min: min, max: max}`
* Array: `[min, max]`

min and max are numbers in range 0 (worst) to 100 (perfect), similar to JPEG.
For example as object: `{min: 60, max: 80}`.

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
        binary: 'path/to/pngquant', // specify pngquant path if on Linux
        concurrency: 8,             // specify how many exucutables get spawned in parallel
        colors: 128,                // reduce colors to 128
        ext: '.png',                // use .png as extension for the optimized files
        quality: '65-80',           // output quality should be between 65 and 80 like jpeg quality
        speed: 10,                  // pngquant should be as fast as possible
        iebug: true                 // optimize image for use in Internet Explorer 6
      },
      files: [
        {
          src: 'path/to/images/*.png',
          dest: 'dest/'
        },
        {
          src: 'path/to/other/images/*.png',
          dest: 'another/dest/'
        }
      ]
    }
  }
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
- 0.6.1: Added postinstall script to change permission on the OS X pngquant binary
- 0.6.0: pngquant binary is now included for windows and mac users (no additional pngquant installation need)
- 0.5.1: Fixed potential issue with quality option
- 0.5.0: Quality option of pngquant revealed to the plugin user
- 0.4.5: Shows overall saved bytes
- 0.4.4: Uses pngquant if it's in the `PATH`, otherwise uses fallback, but options.binary has always precedence
- 0.4.3: Fixed issue with total percent
- 0.4.2: Filesize of old and optimized image is shown
- 0.4.1: Gives a hint if no images were found
- 0.4.0: Destination doesn't have to be a directory anymore
- 0.3.4: If the `force` option is false and the file already exists at the destination pngquant doesn't get spawned
- 0.3.3: The total savings are displayed
- 0.3.2: The force option is no longer required if '.png' is set as ext option
- 0.3.1: If the optimization increases file size, the original file is copied to the destination
- 0.3.0: Corrected behaviour if files object is built dynamically (http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically)
- 0.2.1: Just one queue is created
- 0.2.0: The pngquant executable gets queued to avoid a problem with too many spawned executables
- 0.1.0: Initial release
