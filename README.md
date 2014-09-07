Avoid callback hell by employing continuously invoked generators.
====

Skip directly to the [API](#api).

## Introduction

ContinuousGenerator involves employing generators from EcmaScript6. Generators are currently working in v0.11 of nodejs (unstable). From this point forward I'll assume you're semi-familiar with generators.

You probably know what callback hell is, and hopefully you're familiar with promises. ContinuousGenerator allows you to write asynchronous functions that pause to execute asynchronous calls, then resume after the asynchronous calls have completed. ContinousousGenerator also works well with promises. 

### Introductory Example

##### Using ContinuousGenerator to implement a function with several asynchronous calls

```javascript
var execute = require('ContinuousGenerator').execute;

// This example isn't complete for sake of brevity..
// Imagine for a moment that we've already set up
// an Http node server and eventually ended up creating an instance of
// this class, UserResonder, passing in the `request` and `response`.
// Then we called responder.respond() to actually respond to the request.
function UserResponder(nodeReq, nodeRes) {
   this.req = nodeReq;
   this.res = nodeRes;
}

UserResponder.prototype.respond = function respond() {
   // some logic to determine whether request is login or register ...
   register();
};

UserResponder.prototype.login = function login() {/* ... */};

function getPostDataPromise() {/* ... */};

UserResponder.prototype.register = function register() {
   // here we use ContinuousGenerator.execute to continuously execute the
   // generator.
   // The generator is the first argument, the 'this' argument is the second
   // argument to execute, and the arguemnts you want the generator to
   // be passed are all the other arguments.
   var returnValueP = execute(registerNewUser, this, this.req, this.res);

   // returnValueP is a promise that resolves to the return value of the
   // generator's execution. It is only resolved once the generator has
   // successfully completed executing.

   // You can also configure ContinuousGenerator to take a standard callback
   // instead.
};

/**
 * You can configure ContinuousGenerator to call your own `unhandledError`
 * function when an error occurs in your generator that was not caught.
 *
 * You can also configure ContinuousGenerator to reject the returnValuePromise,
 * call a global `unhandledError` function, or invoke a standard callback
 * (passed to execute) with the error.
 */
UserResponder.prototype.onUnhandledError = function onUnhandledError(e) {
   this.res.writeHead('500');
   this.res.end('500: Unexpected Server Error');
};

/**
 * Called on ajax POST request to register a new user.
 *
 * This is a generator function. If you don't know what generators are or
 *  aren't familiar enough to use them, you might want to read up on them
 *  first lest this won't make much sense. You should be familiar with
 *  `yield` `throw` and `next` (with respect to generators).
 */
function* registerNewUser(cont, req, res) {
   // validate that the request is fair game
   
   var postDataPromise = this.getPostDataPromise();

   // cont.p is a function that takes a promise and resumes the continuous
   // generator when the promise has resolved.
   // If the promise was resolved, cont.p will yield the resolved value
   // into the generator--resuming execution.
   // If the promise was rejected, cont.p will throw the rejected value
   // into the generator--resuming execution.

   var postData = yield cont.p(postDataPromise.then(JSON.parse));

   try {
      var user = yield UserLib.createUser({
         username: postData.username,
         passwordHash: postData.passwordHash,
         email: postData.email,
      }, cont);

      // cont is a standard node callback function in the form (err, val).
      // cont will resume execution of your generator when it is called.
      // it is safe to call from synchronous functions due to a process.nextTick
      //  sync-guard
      // as expected, if err is defined, cont throws `err` into the
      // generator when it resumes execution.
      // otherwise cont resumes execution by yielding `val`.

      var sessionId = yield UserLib.login(user, cont);
      var response = {
         'success': true,
         'sessionId': sessionId,
      };
   } catch (e) {
      var response = {
         'success': false,
      };
      switch (e.code) {
      case 'USERNAME_INVALID':
      case 'USERNAME_TAKEN':
      case 'EMAIL_INVALID':
      case 'EMAIL_TAKEN':
         response.reason = e.code;
         break;
      default:
         response.reason = '500';
         res.writeHead('500');
      }
   }

   res.end(response);

   // when the function returns, since we didn't
   // specify another cont function to be executed, the generator will
   // finaly stop being invoked.
   return response.success;
}
```

## API

Table of contents:

* [ContinuousGenerator](#continuousgenerator) (module)
* [ContinuousGenerator.execute](#continuousgenerator-execute)
* [ContinuousGenerator.configure](#continuousgenerator-configure)
* [ContinuousGenerator.Executor](#continuousgenerator-executor)
* [cont](#cont)

---

### ContinuousGenerator

```javascript
module.exports = {
   execute,
   configure,
   Executor,
}
```
- [execute](#continuousgenerator-execute) is the item of most interest. `execute` is how you actually execute a generator.
- [configure](#continuousgenerator-configure) is how you configure `ContinuousGenerator` to better suit your needs and coding style.
- [executor](#continuousgenerator-executor) is how generators actually get continually executed. It contains the logic necissary to provide different return types and error handling as well as some other stuff.

[Go up to API contents](#api)

---

### ContinuousGenerator.execute

```javascript
function execute(generator, context, callback, arg1, arg2, arg3, etc)
```

Create an instance of `generator`, and continuously execute it through all synchronous and asynchronous yields.

Parameters:

- **generator** - a reference to a generator function you wish to execute until completion.
- **context** - a reference to an object that will be the context of the running generator (bound as `this` in your generator function).
- **callback** (optional) - a callback to be called when your generator function has completed
 or there is an uncaught error in the function.
- **arguments** (optional) - all your arguments that you want to get passed to the generator should
 go here. Note: by default the first parameter of the generator function is [cont](#cont). This means that your arguments actually start of with the second parameter to your generator (unless you disable the option).

[Go up to API contents](#api)

---

### ContinuousGenerator.configure

```javascript
function configure(options)
```

Configure `ContinuousGenerator` to better suit your needs and style.

Some things you can do:
- specify that `cont` should not be passed as the first param to your generator.
   - `contFirstParam: false`
- specify that `cont` should not be defined on `context` (this of your generator)
   - `contDefinedOnThis: false`
- specify the methods (and order) of how returnValues and exceptions that aren't caught in your generator are returned to you.

The options are pretty well documented in [ContinuousGenerator.njs](ContinuousGenerator.njs).

[Go up to API contents](#api)

---

### ContinuousGenerator.Executor

```javascript
function Executor(generator, context, callback, options, args)
```

An internal helper class which executes genrators. The code isn't so bad, check it out.

[Go up to API contents](#api)

---

### cont

```javascript
function continueFromCallback(err, val)
function continueFromPromise(promise)
```

Resume the generator.

`cont` should be called exactly once for every `yield` in your generator. You can continue by calling the callback or by passing a promise to `cont.p`, which when it is resolved or is rejected, will resume your generator.

Both `cont` and `cont.p` will resume your generator by returning a value into it or throwing a value into it (at the yield).

The value `cont` or `cont.p` returns or throws depends on what you pass to the callback or what your promise resolves/rejects to.

##### Aliases

```javascript
cont.callback = cont.c = cont;
cont.promise = cont.p;
```

[Go up to API contents](#api)
