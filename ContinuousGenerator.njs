/**
 * ContinuousGenerator is a module which executes a generator abiding by the
 *  generator contract continuously. Continuously means the
 *  generator will execute top to bottom resuming after each yielded asychronous
 *  function call is made.
 * 
 * Problem: "Callback Hell" is hell. Generators can solve callback hell in
 *  a lovely way, but they need to be resumed each time they are yielded.
 *  Boilerplate code is needed to continusouly resume generators.
 *
 * Solution: ContinuousGenerator provides the boilerplate code for generators
 *  to be resumed after asynchronous function calls have completed.
 */

/**
 * -------------------------------- CONTRACT -----------------------------------
 *
 * Requires:
 * 
 * 1. The generator (param to execute) must be a nodejs generator.
 *
 * 2. Each time the generator wishes to resume after an asychronous call has
 *  completed it uses the yield statement. The callback of the asynchronous call
 *  must invoke the first parameter of the generator (the continueExecution
 *  function) when the call has completed.
 *
 * Ensures:
 *
 * 1. The generator is resumed after every asychronous yield has completed.
 *
 * 2. If an error is passed to the continueExecution function, that error
 *  is thrown into the generator function at the yield statement.
 *
 * 3. If no error is passed to the continueExecution function, the yield
 *  expression evauluates to the data parameter.
 *
 * ------------------------------ END CONTRACT ---------------------------------
 */

module.exports = {
   execute : execute
};

/**
 * Create an instance of a generator and execute it continuously through all
 *  yields.
 *
 * @param generator the generator to be continuously executed.
 * @param args (optional) an array of arguments to pass to the generator
 * @param thisObj (option) the object to bind to "this" inside the generator
 */
function execute(generator, args, thisObj)
{
   // TODO There should be a better way to do this.
   // The instance needs a reference to the continueExecution function which
   // needs a references to the instance.
   var instance = {};

   var contExecution = continueExecution.bind(instance);

   instance.instance = generator.apply(thisObj,
      args === undefined ? [contExecution] : [contExecution].concat(args)
   );

   contExecution();
}

/**
 * continueExecution is used to continue executing a generator after it has
 *  yielded.
 *
 * If err is truthy, the error is thrown into the generator resulting in an
 *  error raised at the yield statement.
 *
 * Else, data becomes the value of the yield expression that this call of
 *  continueExecution resumes from.
 *
 * @param this the generator instance to continue executing
 * @param err (optional) an error, if one occured
 * @param data (optional) data to return to the generator
 */
function continueExecution(err, data)
{
   var instance = this.instance;

   //
   // TODO allow the user to specify a "strict" setting or something to avoid
   // this setTimeout stuff. They don't get the added protection, but they get
   // to increase performance a bit.
   //
   // This will prevent a lot of unneeded frustration. Some functions that
   //  are supposed to be asychronous call their callbacks synchronously in
   //  certain circumstances (eg invalid input). Generators throw an error
   //  if next or throw is called while they are still running.
   // 
   // setTimeout ensures that next() and throw() are called asynchronously.
   //  It is a minor performance hit, but if the caller needs
   //  superb performance they probably shouldn't be using generators anyway.
   //
   setTimeout(realContinueExecute, 0);

   //
   // I spent some time thinking about this... A closure really does need to be
   // created on each and every call of continueExecution because
   // of setTimeout. Still, I think the benefits of not having an runtime error
   // that only bites you in the ass in rare circumstances outweighs
   // the overhead introduced by creating a closure and delaying with setTimeout
   // every time this function is called.
   //
   function realContinueExecute()
   {
      if (err)
      {
         instance.throw(err);
      }
      else
      {
         instance.next(data);
      }
   }
}
