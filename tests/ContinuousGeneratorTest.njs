var execute = require('../ContinuousGenerator.njs').execute;

exports.setUp =
function(callback)
{
   callback();
}
exports.tearDown =
function(callback)
{
   callback();
}

// arguments are passed to generators correctly
exports.testArgs =
function args(test)
{

   function* gen(continueExecution)
   {
      test.strictEqual(arguments.length, 1);
      test.equal(typeof continueExecution, "function");
      done();
   }

   execute(gen);
   execute(gen, []);

   var taco = {};
   var burrito = {};

   function* gen2(continueExecution, arg1)
   {
      test.strictEqual(arguments.length, 2);
      test.strictEqual(arg1, taco);
      done();
   }

   execute(gen2, [taco]);

   function* gen3(continueExecution, arg1, arg2)
   {
      test.strictEqual(arguments.length, 3);
      test.equal(typeof continueExecution, "function");
      test.strictEqual(arg1, taco);
      test.strictEqual(arg2, burrito);
      done();
   }

   execute(gen3, [taco, burrito]);

   var toComplete = 4;
   var completed = 0;
   function done()
   {
      if (++completed === toComplete)
      {
         test.done();
      }
   }

   // now that args have been tested, it's cool to use arguments so we can use
   // async
   setTimeout(function()
   {
      if (completed !== toComplete)
      {
         throw new Error("testArgs didn't complete");
      }
   }, 100)
};

// generators resume from yields properly
exports.testContinueFromExecutionAndOnlyExecuteOnce =
function continueFromExecutionAndOnlyExecuteOnce(test)
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
      test.strictEqual(executed, 1);
      test.done();
   }, 100);
};

// continueExecution returns correct values
exports.testReturnValues
= function retVals(test)
{
   function* gen(continueExecution)
   {
      var retVal = yield setTimeout(function()
      {
         continueExecution(null, 7);
      }, 0);
      
      test.strictEqual(retVal, 7);

      retVal = yield setTimeout(function()
      {
         continueExecution();
      }, 0);

      test.strictEqual(retVal, undefined);

      var taco = {sdf:{shindig:9}};

      retVal = yield setTimeout(function()
      {
         continueExecution(null, taco);
      }, 0);

      test.strictEqual(retVal, taco);
      test.strictEqual(retVal.sdf, taco.sdf);
      test.done();
   }

   execute(gen);
};

// throwing works as it is supposed to
exports.testThrowing =
function throwing(test)
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
         test.ok(false);
      }
      catch (err)
      {
         test.strictEqual(err, error);
         errorCaught = true;
      }

      test.ok(errorCaught);
      test.done();
   }

   execute(gen);
};

// there are unique instances being created
// that can have differnt positions in execution and different arguments.
exports.testDifferentGeneratorInstances =
function differentGeneratorInstances(test)
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
         test.strictEqual(position1, 1);
         test.strictEqual(position2, 0);
      }
      else if (number === 2)
      {
         ++position2;
         test.strictEqual(position1, 2);
         test.strictEqual(position2, 1);
      }
      else
         test.ok(false);

      callback(number);
   }

   execute(gen, [1, function(number)
   {
      if (number === 1)
         ++position1;
      else if (number == 2)
         ++position2;
      else
         test.ok(false);
   }]);

   setTimeout(function()
   {
      test.strictEqual(position1, 2)
      test.strictEqual(position2, 2);
      test.done();
   }, 100);
};

// this is bound to the instance properly
exports.testThis =
function thisTest(test)
{
   var taco = {};

   function* gen()
   {
      test.strictEqual(this, taco);
      test.strictEqual(arguments.length, 2);
      test.done();
   }

   execute(gen, [null], taco);
}

// can continue be called synchronously? it should be able to.
exports.testAsyncNotRequired =
function notAsync(test)
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
      test.ok(finished);
      test.done();
   }, 100);
};
