module.exports = execute;
var Promise = require('promise');

/**
 * Execute a generator continuously.
 *
 * The generator yields promises, the results of which are yielded or thrown
 * back into the generator.
 *
 * @resolve the return value of the generator
 * @reject an unhandled error thrown inside the generator
 */
function execute(Generator, context, arg1, arg2, arg3, etc) {
  var args = Array.prototype.slice.call(arguments, 2);
  var generatorInstance = Generator.apply(context, args);

  return new Promise(function(resolve, reject) {
    cont({done: false, value: Promise.resolve()});

    function cont(retval) {
      if (retval.done === true) {
        return resolve(retval.value);
      }

      // else, generator not finished
      var yieldedPromise = retval.value;
      yieldedPromise.done(function(val) {
        try {
          var ret = generatorInstance.next(val);
        } catch (e) {
          return reject(e);
        }
        cont(ret);
      }, function(err) {
        try {
          var ret = generatorInstance.throw(err);
        } catch (e) {
          return reject(e);
        }
        cont(ret);
      });
    }
  });
}
