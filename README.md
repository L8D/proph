proph
=====

A tiny, simple and fast futures implementation.

Usage
-----

```js
var Future = require('proph');
var fs = require('fs');

var readFile = Future.wrap(fs.readFile);

var files = Future.concat(readFile('README.md'), readFile('package.json'));

files.fork(function(err) {
  console.error('Error reading files: ' + err);
}, function(files) {
  console.log('README.md is ' + files[0].length + ' bytes');
  console.log('package.json is ' + files[1].length + ' bytes');
});
```

Or write your own wrappers!

```js
var Future = require('proph');
var fs = require('fs');

var exists = function(path) {
  return new Future(function(reject, resolve) {
    fs.exists(path, function(itExists) {
      if (itExists) {
        reject();
      } else {
        resolve();
      }
    });
  });
};

exists('package.json').fold(function() {
  console.log('nooo!');
}, function() {
  console.log('yay!');
}).exec();

function nop() {}
```

Install
-------

You can get proph on npm.

```bash
$ npm install --save proph
```

And even bower!

```bash
$ bower install --save proph
```


