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
 * 3. The call continueExecution <b>must be asynchronous</b>.
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
 * See exampleGenerator_countdown and exampleExecute_countdown
 *
 * ------------------------------ END CONTRACT ---------------------------------
 */

/**
 *
 * An example of a generator that abides by the contract.
 */
function* exampleGenerator_countdown(continueExecution, startFrom, callback)
{
   function printAsync(message, callback)
   {
      setTimeout(function()
      {
         console.log(message)
         callback();
      }, 0);
   }

   // call printAsync. When printAsync has finished it will call
   //  continueExecution which resumes the generator.
   yield printAsync(this.startText, continueExecution);

   try
   {
      while(true)
      {
         var toPrint = yield setTimeout(function()
         {
            if (startFrom < 0)
            {
               continueExecution(new Error("startFrom is negative!"));
            }
            else
            {
               continueExecution(null, (startFrom--) + "...");
            }
         }, 1000);

         console.log(toPrint);
      }
   }
   catch (err)
   {
      console.log(this.endText);
      callback();
   }


   
}

/**
 * An example of executing a generator that abides by the contract.
 */
function exampleExecute_countdown()
{
   // var execute = require('ContinuousGenerator').execute;

   function finishedCountdown()
   {
      console.log("countdown has finished.. do something..");
   }

   var theThisObject = {
      startText: "Countdown started.",
      endText: "BOOM!"
   };

   execute(exampleGenerator_countdown, [10, finishedCountdown], theThisObject);
   /* stdout:
    *
    * Countdown started.
    * 10...
    * 9...
    * 8...
    * 7...
    * 6...
    * 5...
    * 4...
    * 3...
    * 2...
    * 1...
    * 0...
    * BOOM!
    * countdown has finished.. do something..
    */
}


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
   var instance = {};
   var cont = continueExecution.bind(instance);

   instance.instance = generator.apply(thisObj, [cont].concat(args));

   cont();
}

/**
 * Next is bound to a generator object and is used to return from yields.
 */
function continueExecution(err, data)
{
   if (err)
   {
      this.instance.throw(err);
   }
   else
   {
      this.instance.next(data);
   }
}

if (require.main === module)
{
   exampleExecute_countdown();
}
