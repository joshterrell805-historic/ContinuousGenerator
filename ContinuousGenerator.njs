module.exports =
{
   execute : execute
};

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
