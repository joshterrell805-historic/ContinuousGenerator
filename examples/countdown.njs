/**
 *
 * An example of a generator that abides by the contract.
 */
function* countdown(
   continueExecution,   // the function used to continue executing the
                        //  generator after an asychronous call

   startFrom,           // custom parameter: first element in the args array
   callback             // custom parameter: second element in the args array
)
{

   // call printAsync then yield. When printAsync has finished it will call
   //  continueExecution which resumes the generator right after the yield.
   yield printAsync(this.startText, continueExecution);

   // This part of the example uses some additional features of
   //  continueExecution. continueExecution can throw an error into the
   //  generator or pass a value back to the generator.
   //
   // Preserving the nodejs async callback spirit, the first parameter to
   //  continueExecution is the error that occured (if any) and the second
   //  parameter is the data (if any).
   // 
   try
   {
      while(true)
      {
         var toPrint = yield setTimeout(function()
         {
            // This entire function is asychronously executed because it is
            //  in a setTimeout call. The continueExecution calls below
            //  resume the execution of the generator from where it left off
            //  either assigning a variable into toPrint or throwing
            //  an exception.

            if (startFrom < 0)
            {
               // If the error parameter (first) of the continueExecution
               // function is truthy, the error is thrown into the generator
               // at the yield statement (no value is returned from yield).
               //
               // In this case, the catch statement below catches the
               // error thrown when startFrom is negative.
               continueExecution(new Error("startFrom is negative!"));
            }
            else
            {
               // If the error parameter of continueExecution is falsy (null,
               //  undefined, ...), no error is thrown into the generator. The
               //  value of the second parameter (data) is returned by the yield
               //  expression.
               //
               // In this case, the value of the expression
               // (startFrom--) + "..."
               // is returned as the value of the yield statement
               // which is in turn assigned to the toPrint variable above.
               continueExecution(null, (startFrom--) + "...");
            }
         }, 1000);

         console.log(toPrint);
      }
   }
   catch (err)
   {
      console.log(this.endText);
   }

   // callback is a custom parameter--not built into the ContinuosGenerator
   //  module. The user decides to call his callback here when he knows
   //  the generator is complete.
   callback();

   // Because no yields remain and there are no continueExecution calls pending
   //  on asychronous callbacks, the generator terminates gracefully here.
}

var execute = require('../ContinuousGenerator.njs').execute;

function finishedCountdown()
{
   console.log("countdown has finished.. do something..");
}

function printAsync(message, callback)
{
   setTimeout(function()
   {
      console.log(message)
      callback();
   }, 0);
}


var theThisObject = {
   startText: "Countdown started.",
   endText: "BOOM!"
};


// This call to execute starts the continuously executed generator.
execute(
   countdown,                 // the generator to be executed
   [10, finishedCountdown],   // the arguments to the generator
   theThisObject              // the object to bind to this of the generator
);

/* output:

Countdown started.
10...
9...
8...
7...
6...
5...
4...
3...
2...
1...
0...
BOOM!
countdown has finished.. do something..
 */
