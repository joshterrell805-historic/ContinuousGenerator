Avoid callback hell by employing continuously invoked generators.
====

Execute code asynchronously, and return back to the calling context after the
asynchronous code has executed.

**Requires: node v11 or greater**

### Run Tests
mocha --harmony test.mocha.njs

### Examples
Also, see tests.

This example is some production code from a project I am working on.
I thought it was a great example of how much more readable contgen makes my
code.

I originally wrote the promise version for testing, then refactored it to the
contgen version for readability.
```js
var _ = require('underscore'),
    Promise = require('Promise'),
    fs = require('fs'),
    contgen = require('ContinuousGenerator');

var unlink = Promise.denodeify(fs.unlink);

module.exports = {
  promiseUploadImages: promiseUploadImages,
  // or
  promiseUploadImages: contgen.promise(uploadImagesGen),
};

// with promises and no generators
function* promiseUploadImages(base64s) {
  var images = [];
  // successively upload each image
  return _.reduce(base64s, function(memo, base64) {
    return memo
    .then(function() {
      return promiseUploadImage_(base64)
      .then(function(image) {
        images.push(image);
      });
    });
  }, Promise.resolve())
  .then(function() {
    // on success, return the array of hashes describing the images.
    return images;
  }, function(err) {
    // on error, delete all successfully uploaded images
    return Promise.all(_.map(images, function(image) {
      return unlink(config.uploadImageDir + image.path);
    }))
    .then(function() {
      throw err;
    })
  });
}


// with generators
function *uploadImagesGen(base64s) {
  try {
    var images = [];

    for(var i = 0; i < base64s.length; ++i) {
      var image = yield promiseUploadImage_(base64[i]);
      images.push(image);
    }

    return images;
  } catch (e) {
    for (var i = 0; i < images.length; ++i) {
      yield unlink(config.uploadImageDir + image[i].path);
    }
    throw e;
  }
}

function promiseUploadImage_(base64) {
  // upload the image and return a promise for its successful upload
  // ...
}
```
