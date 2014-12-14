var p = require('./ContinuousGenerator.njs')(function*() {
  console.log('what');
  //throw 'fuck';
  return 10;
}, {}, 1).done(function(asdf) {console.log(asdf)});
