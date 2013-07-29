/*
 * Postinstall script
 *
 * Copyright (c) 2013 Matthias Zaunseder
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');

if (process.platform === 'darwin') {
    fs.chmodSync('node_modules/node-pngquant-bin/vendor/osx/pngquant', parseInt(700, 8));
}