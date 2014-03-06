var execute = require('../ContinuousGenerator.njs').execute;
var assert = require('assert');

var tests = [
   // args are passed correctly
   function args()
   {
      function* gen(continueExecution)
      {
         assert.strictEqual(arguments.length, 1);
         assert(typeof continueExecution == "function");
      }

      execute(gen);
      execute(gen, []);

      var taco = {};
      var burrito = {};

      function* gen2(continueExecution, arg1)
      {
         assert.strictEqual(arguments.length, 2);
         assert.strictEqual(arg1, taco);
      }

      execute(gen2, [taco]);

      function* gen3(continueExecution, arg1, arg2)
      {
         assert.strictEqual(arguments.length, 3);
         assert(typeof continueExecution == "function");
         assert.strictEqual(arg1, taco);
         assert.strictEqual(arg2, burrito);
      }

      execute(gen3, [taco, burrito]);
   },
   // generators resume from yields properly
   function continueFromExecutionAndOnlyExecuteOnce()
   {
      var executed = 0;

      function* gen(continueExecution)
      {
         yield setTimeout(continueExecution, 0);
         ++executed;
      }

      execute(gen);

      setTimeout(function()
      {
         assert.strictEqual(executed, 1);
      }, 100);
   },
   // continueExecution returns correct values
   function retVals()
   {
      function* gen(continueExecution)
      {
         var retVal = yield setTimeout(function()
         {
            continueExecution(null, 7);
         }, 0);
         
         assert.strictEqual(retVal, 7);

         retVal = yield setTimeout(function()
         {
            continueExecution();
         }, 0);

         assert.strictEqual(retVal, undefined);

         var taco = {sdf:{shindig:9}};

         retVal = yield setTimeout(function()
         {
            continueExecution(null, taco);
         }, 0);

         assert.strictEqual(retVal, taco);
         assert.strictEqual(retVal.sdf, taco.sdf);
      }

      execute(gen);
   },
   // throwing works as it is supposed to
   function throwing()
   {
      function* gen(continueExecution)
      {
         var error = new Error("asdf");
         var errorCaught = false;

         try
         {
            yield setTimeout(function()
            {
               continueExecution(error);
            }, 0);

            // this should never get executed
            assert(false);
         }
         catch (err)
         {
            assert.strictEqual(err, error);
            errorCaught = true;
         }

         assert(errorCaught);
      }

      execute(gen);
   },
   // there are unique instances being created
   // that can have differnt positions in execution and different arguments.
   function differentGeneratorInstances()
   {
      var secondCreated = false;
      var position1 = 0;
      var position2 = 0;

      function* gen(continueExecution, number, callback)
      {
         yield setTimeout(function()
         {
            continueExecution();

            if (number === 1)
               execute(gen, [2, callback]);

         }, 0);

         if (number === 1)
         {
            ++position1;
            assert.strictEqual(position1, 1);
            assert.strictEqual(position2, 0);
         }
         else if (number === 2)
         {
            ++position2;
            assert.strictEqual(position1, 2);
            assert.strictEqual(position2, 1);
         }
         else
            assert(false);

         callback(number);
      }

      execute(gen, [1, function(number)
      {
         if (number === 1)
            ++position1;
         else if (number == 2)
            ++position2;
         else
            assert(false);
      }]);

      setTimeout(function()
      {
         assert.strictEqual(position1, 2)
         assert.strictEqual(position2, 2);
      }, 100);
   },
   function thisTest()
   {
      var taco = {};

      function* gen()
      {
         assert.strictEqual(this, taco);
         assert.strictEqual(arguments.length, 2);
      }

      execute(gen, [null], taco);
   },
   function notAsync()
   {
      var finished = false;
      function * gen(cont)
      {
         // this would normally throw an error because the generator is still
         // executing.
         // this tests whether the continue function can be called synchronously
         // cont is actually executed asynchronously, see the code/comments
         // for why this works.
         yield cont();
         finished = true;
      }

      execute(gen);
      
      setTimeout(function()
      {
         assert(finished);
      }, 100);
   }
];

for (var i = 0; i < tests.length; ++i)
{
   tests[i]();
   process.stdout.write('.');
}

console.log('done!');
