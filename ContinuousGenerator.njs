module.exports = {
   execute: execute,
   configure: configure,
};

var defaultOptions = {
   // There are two options for receiving the continue method (so far):
   // pass the continue function as the first argument to the generator
   // and/or store continue on the `this` object.
   contFirstParam: true,
   contDefinedOnThis: true,

   // The return value returned from your generator will returned by...
   // choose one or many.
   // promise | callback
   returnMethods: ['promise', 'callback'], // order matters

   // if you chose 'contDefinedOnThis' == true, this is the field of `this` that
   // cont will be defined in.
   contName: 'cont',
   contEnumerable: true,
   contConfigurable: true,
   contWritable: true,

   // unhandled error returned to caller by:
   // choose one or many.
   // promise | callback | configOnError | thisOnError
   unhandledErrorMethods: ['promise', 'callback'], // order matters

   // if unhandledErrorMethod == 'configOnError', call this function when
   // an error occurs.
   onUnhandledError: onUnhandledError,

   // if unhandledErrorMethod == 'thisOnError', call `_this.onUnhandledError`
   // (or whatever you set this option to) when there is an un caught
   // error thrown from within the generator.
   // You need to define this
   thisOnUnhandledErrorName: 'onUnhandledError',

   // We need to store the executor instance in a variable on this.
   executorInstanceName: '_ContinuousGenerator_executorInstance',
   executorInstanceEnumerable: false,
   executorInstanceConfigurable: false,
   executorInstanceWritable: false,

   Executor: require('./Executor.njs'),
};

var options = defaultOptions;

function configure(opts) {
   options = _.defaults({}, opts, defaultOptions);
}

function execute(generator, context, callback, arg1, arg2, arg3, etc) {
   if (context === null) {
      // Who does function.call(undefined, arg1, ...)?
      // Don't catch undefined in case it was an accident
      // (allow error to be thrown).. null is likely not an accident.
      context = {};
   }

   var Executor = options.Executor;
   var executor = new Executor(generator, context, callback,
    options, Array.prototype.slice(arguments, 3));

   return executor.execute();
}

function onUnhandledError(err) {
   throw e;
}
