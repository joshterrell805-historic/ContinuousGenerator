var assert = require('assert');
var exec = require('./ContinuousGenerator.njs');
var Promise = require('promise');

describe('ContinuousGenerator', function() {
  describe('#apply', function() {
    it('should pass array as arguments to generator', function(done) {
      exec.apply(function*(a, b) {return {'a': a, 'b': b};}, null, [4,8])
      .done(function(val) {
        assert.strictEqual(val.a, 4);
        assert.strictEqual(val.b, 8);
        done();
      });
    });
    it('should set `this` context', function(done) {
      var dis = {asdf: 23};
      exec.apply(function* () {return this;}, dis)
      .done(function(val) {
        assert.strictEqual(val, dis);
        done();
      });
    });
  });
  describe('#promise', function() {
    it('should pass args', function(done) {
      var f = exec.promise(function*(a, b) {return{'a':a,'b':b};});
      f(4, 8)
      .done(function(val) {
        assert.strictEqual(val.a, 4);
        assert.strictEqual(val.b, 8);
        done();
      });
    });
    it('should set `this` context', function(done) {
      var dis = {asdf: 23};
      var f = exec.promise(function* () {return this;});
      f.call(dis)
      .done(function(val) {
        assert.strictEqual(val, dis);
        assert.strictEqual(val.asdf, dis.asdf);
        done();
      });
    });
  });
  describe('#execute (call)', function() {
    it('should return appropriate value', function(done) {
      exec(function* () {return 'z';}, null)
      .done(function(val) {
        assert.strictEqual(val, 'z');
        done();
      });
    });
    it('should pass parameters', function(done) {
      exec(function* (x, y, z) {return {x:x, y:y, z:z};}, null, 1, 2, 3)
      .done(function(val) {
        assert.strictEqual(val.x, 1);
        assert.strictEqual(val.y, 2);
        assert.strictEqual(val.z, 3);
        done();
      });
    });
    it('should set `this` context', function(done) {
      var dis = {asdf: 23};
      exec(function* () {return this;}, dis)
      .done(function(val) {
        assert.strictEqual(val, dis);
        done();
      });
    });
    it('should reject promise on unhandled error', function(done) {
      exec(function* () {throw 4;})
      .done(function(val) {
        assert(false);
      }, function(err) {
        assert.strictEqual(err, 4);
        done();
      });
    });
    it('should resume with resolved value of yield', function(done) {
      exec(function* () {
        var x = yield Promise.resolve(-10);
        assert.strictEqual(x, -10);
        done();
      })
      .done();
    });
    it('should resume with rejected value of yield', function(done) {
      exec(function* () {
        try {
          yield Promise.reject(-11);
        } catch (e) {
          assert.strictEqual(e, -11);
          return done();
        }
      })
      .done();
    });
    it('should reject to unhandled error', function(done) {
      exec(function* () {PromiseTypo.asdf();})
      .done(function(val) {assert(false);}, function(err) {done();});
    });
  });
});
