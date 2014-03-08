Avoid callback hell by employing generators.
====

Skip directly to the [API](#api).

## Introduction

They don't call it callback *hell* for nothing. There are several ways to avoid callback hell; here is my favorite.

ContinuousGenerator involves employing generators from EcmaScript6. Generators are currently working in v0.11 of nodejs (unstable). From this point forward I'll assume you're semi-familiar with generators.

Callback hell arises in javascript when an algorithm involves several asychronous calls which must happen sequentially.

Example -- A typical approach in implementing an algorithm involving two asynchronous steps
```javascript
function algorithm()
{
    var data;
    
    // some sync steps ...
  
   asyncStepOne(data, function(err, resultOne)
    {
      if (err)
        {
         // handle error ...
        }
            
        // some sync steps ...
        
        
        asyncStepTwo(resultOne, function(err, resultTwo)
        {
         if (err)
            {
               // handle error ...
            }
            
            // some sync steps ...
            
            updateDisplay(resultTwo);
        });
    });
}

function updateDisplay(results)
{
   // do some updating with the results
}

algorithm();
```

Wow! That's only two function calls. Lets clean this up with a generator and the ContinuousGenerator module.

Example -- Using generators and the ContinuousGenerator module to implement the same algorithm
```javascript
var execute = require('ContinuousGenerator').execute;

function* algorithm(continueExecution)
{
    var data;
    
    // some sync steps ...
  
    try
    {
       var resultOne = yield asyncStepOne(data, continueExecution);
    }
    catch (err)
    {
      // handle error ...
    }
    
    // some sync steps ...
    
    try
    {
        var resultTwo = yield asyncStepTwo(resultOne, continueExecution); 
    }
    catch (err)
    {
      // handle error ...
    }
    
   // some sync steps ...
            
    updateDisplay(resultTwo);
}

function updateDisplay(results)
{
   // do some updating with the results
}

execute(algorithm);
```
The code is much neater, objectively speaking. By using a generator the second example is able to return to executing *algorithm* 
after an asychronous call has completed. [continueExecution](#continueexecution) is the callback that continues the *algorithm* after *asycStepOne* has completed.

Sold? Here's the docs.

## <a name="api"></a> API
Warning: I just learned about design by contract and I'm a fan. I do no error checking, so make sure you use the API correctly.

Table of contents:

* [ContinuousGenerator](#continuousgenerator) (module)
* [execute](#execute)
* [continueExecution](#continueExecution)
* [Generator Contract](#generator-contract)

---

### <a name="continuousgenerator"></a> ContinuousGenerator

```javascript
module.exports =
{
   execute : execute
}
```

The module itself. ContinuousGenerator (for now) contains one exposed method: [execute](#execute)

[Go up to API contents](#api)

---

### execute

```javascript
function execute(generator, arguments, thisObject) {...}
```

Create an instance of `generator`, and continuously execute it through all asychronous yields.

Parameters:

* **generator** - a reference to a generator function. Must abide by the [Generator Contract](#generator-contract).
* **arguments** (optional) - an array of arguments to be passed to the generator upon instantiation
* **thisObject** (optional) - an object to bind to `this` on the generator instance

[Go up to API contents](#api)

---

### <a name="continueexecution"></a> continueExecution

```javascript
function continueExecution(error, data) {...}
```

Resume the generator from its last `yield`.

Parameters:

* **error** (optional) - the error to be thrown into the generator
* **data** (optional) - the data to be returned into the generator

If error is truthy, the error is thrown into the generator at the yield statement. Otherwise data is returned into the generator at the yield statement.

*Note: this function may be called synchronously.*

*Some functions that claim to be asychronous call their callbacks sychronously in certain circumstances (e.g. error). If one tries to resume a generator while it is running (e.g. a yield with a sychronous call to `continueExecution`), an error would normally be thrown. To protect users from this annoying error, `continueExecution` always resumes the generator asychronously which introduces slight performance hit. A version of `continueExecution` that must be called asychrnously may be included in the future to avoid this performance hit.*

[Go up to API contents](#api)

---

### <a name="generator-contract"></a> Generator Contract

This contract states how generators must be designed in order to be executed sucessfully by this module.

Signatures don't matter in javascript--we have the `arguments` array. However, an informational function signature is desplayed below to infer what this module expects of the generators you pass to it.
```javascript
function* functionName(continueExecution, argument1, argument2, argument3, ....) {...}
```

Arguments:

The first argument passed to your generator is the [continueExecution](#continueexecution) method. This method has a reference to your generator instance. You must use this method to resume execution after yielding. The remaining arguments are the elements of the `arguments` array of [execute](#execute). Element1 of the `arguments` array corresponds to argument1, etc.

Asychronous calls:

If the algorithm doesn't need to wait until an asychronous has completed, it should just call the asychronous call without yielding. Using `yield` and [continueExecution](#continueexecution) should only be done when the algorithm needs an asychronous call to finish executing before continuing. [continueExectuion](#continueexecution) should be invoked exactly once per yield in the generator.

*Tip: if the algorithm doesn't care about the order in which two or more asychronous calls are executed, it should execute all of the asychronous calls and yield once. [continueExecution](#continueexecution) should be called after all calls have completed.*

Examples of correctly implemented generators and [execute](#execute) invocations for those generators are supplied in the [examples directory](https://github.com/joshterrell805/ContinuousGenerator/tree/master/examples).

[Go up to API contents](#api)
