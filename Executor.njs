module.exports = Executor;

// Most of the options are only needed in construction.
// These are the ones we need during execution.
//
// They are copied to each instance so they are remembered in case the options
// get changed during generator execution.
var rememberedOptions = ['returnMethods', 'unhandledErrorMethods',
 'onUnhandledError', 'thisOnUnhandledErrorName'];

function Executor(generator, context, callback, options, args) {
   this.generator = generator;
   this.context = context;
   this.callback = callback;
   this.options = _.pick(options, rememberedOptions);
   this.args = args;

   var cont = this.continueFromCallback.bind(context);
   cont.callback = cont.c = cont;
   cont.promise = cont.p = this.continueFromPromise.bind(context);
   this.cont = cont;

   if (options.contFirstParam) {
      this.args.unshift(cont);
   }
   if (options.contDefinedOnThis) {
      define.call(context, options, 'cont', cont);
   }

   define.call(context, options, 'executorInstance', this);

   // Promise.resolve() so resolve/reject added to this now.
   this.returnPromise = Promise.resolve().then(function (resolve, reject) {
      this.promiseReject = reject;
      this.promiseResolve = resolve;
   }.bind(this));
}

Executor.prototype.execute = function execute() {
   this.generatorInstance = this.generator.apply(this.context, this.args);
   this.cont();
   return this.returnPromise;
};

Executor.prototype.continueFromCallback =
 function continueFromCallback(err, val) {

   process.nextTick(function protectFromSynchronousCallbacks() {
      try {
         if (err) {
            var retval = this.generatorInstance.throw(err);
         } else {
            var retval = this.generatorInstance.next(val);
         }
         if (retval.done) {
            for (var i = 0; i < this.options.returnMethods; ++i) {
               var method = this.options.returnMethods[i];
               switch (method) {
               case 'promise':
                  this.promiseResolve(retval.value);
                  break;
               case 'callback':
                  this.callback && this.callback(retval.value);
                  break;
               default:
                  var e = new Error('invalid returnMethod"' + method +'"');
                  e.code = 'INVALID_VALUE';
                  throw e;
               }
            }
         }
      } catch (e) {
         for (var i = 0; i < this.options.unhandledErrorMethods.length; ++i) {
            var method = this.options.unhandledErrorMethods[i];
            switch(method) {
            case 'promise':
               this.promiseReject(e);
               break;
            case 'callback':
               this.callback(e);
               break;
            case 'configOnError':
               this.options.onUnhandledError(e);
               break;
            case 'thisOnError':
               var context = this.generatorContext;
               var handler = context[this.options.thisOnUnhandledErrorName]
               handler.call(context, e);
               break;
            default:
               var e = new Error(
                'invalid unhandledErrorMethod "' + method +'"');
               e.code = 'INVALID_VALUE';
               throw e;
            }
         }
      }
   }.bind(this));
};

Executor.prototype.continueFromPromise = function continueFromPromise(promise) {
   promise.done(function continueFromPromiseSuccess(val) {
      this.continueFromCallback(null, val);
   }.bind(this), function continueFromPromiseFailure(err) {
      this.continueFromCallback(err);
   }.bind(this));
};

/**
 * Define a property on an object given that all the options are set properly
 * in `options`.
 */
function define(options, name, value) {
   Object.defineProperty(_this, name + 'Name', {
      value: value,
      enumerable: options[name + 'Enumerable'],
      configurable: options[name + 'Configurable'],
      writable: options[name + 'Writable',
   });
}
