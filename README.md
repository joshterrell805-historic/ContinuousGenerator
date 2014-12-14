Avoid callback hell by employing continuously invoked generators.
====

Execute code asynchronously, and return back to the calling context after the
asynchronous code has executed.

**Requires: node v11 or greater**

### Run Tests
mocha --harmony test.mocha.njs

### Examples
Also, see tests.

```js
function* Generator(x) {
  console.log(this.y); // 0
  // ContGen resumes the generator with the value that the yielded promise
  // *resolves* to, or it throws the value that the yielded promise *rejects* to
  // back into the generator.
  this.y = yield asyncSquare(x);
  return x + 3;
}

function asyncSquare(x) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve(x*x);
    }, 1000);
  });
}

var ContGen = require('ContinuousGenerator').execute,
    dis = {y: 0};

var resultP = ContGen(
    Generator,  // the generator function
    dis,        // "this" inside the generator
    4           // argument (x)
);

resultP.done(function(val) {
  // the return value of invoking Generator with the arguments above
  console.log(val); // 7
  console.log(dis.y); // 16;
},
function(err) {
  // any uncaught errors thrown into or thrown inside of the generator
  // are received here
});
```
