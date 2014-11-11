/**
 * proph 0.2.0-dev <http://github.com/L8D/proph/>
 * @license MIT
 * @copyright (c) 2014 Tenor Biel
 */
/* global define, exports, module */
/* istanbul ignore next */
(function(root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Future = factory();
  }
})(this, function() {
  'use strict';

  function Future(computation) {
    this.fork = computation;
  }

  // resolve :: b -> Future a b
  Future.resolve = function resolve(resolution) {
    return new Future(function(reject, resolve) {
      resolve(resolution);
    });
  };

  // reject :: a -> Future a b
  Future.reject = function reject(rejection) {
    return new Future(function(reject) {
      reject(rejection);
    });
  };

  // concat :: (Future a b...) -> Future a [b]
  Future.concat = function concat() {
    var argooments = arguments;

    return new Future(function(reject, resolve) {
      var index = argooments.length;
      var resolutions = new Array(index);
      var unfinished = index;
      var rejected;

      var schedule = function(index) {
        argooments[index].fork(function(left) {
          if (!rejected) {
            rejected = true;
            reject(left);
          }
        }, function(right) {
          resolutions[index] = right;

          if (!rejected && !--unfinished) {
            resolve(resolutions);
          }
        });
      };

      while (index--) {
        schedule(index);
      }
    });
  };

  // wrap :: ((a..., (b, c) -> ()) -> ()) -> (a...) -> Future b c
  Future.wrap = function wrap(fn, thisArg) {
    return function() {
      var argooments = arguments;

      return new Future(function(reject, resolve) {
        var index = argooments.length;
        var args = new Array(index + 1);

        args[index] = function(rejection, resolution) {
          if (rejection != null) {
            reject(rejection);
          } else {
            resolve(resolution);
          }
        };

        while (index--) {
          args[index] = argooments[index];
        }

        fn.apply(thisArg, args);
      });
    };
  };

  // wrapPromise :: ((a...) -> Promise a b) -> (a...) -> Future a b
  Future.wrapPromise = function wrapPromise(fn, thisArg) {
    return function() {
      var argooments = arguments;

      return new Future(function(reject, resolve) {
        var promise = fn.apply(thisArg, argooments);

        promise.then(resolve, reject);
      });
    };
  };

  var proto = Future.prototype = {
    // bind :: Future a b -> (b -> Future a c) -> Future a c
    bind: function bind(binder) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(reject, function(right) {
          binder(right).fork(reject, resolve);
        });
      });
    },

    // lbind :: Future a b -> (a -> Future c b) -> Future c b
    lbind: function lbind(binder) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(left) {
          binder(left).fork(reject, resolve);
        }, resolve);
      });
    },

    // bibind :: Future a b -> (a -> Future a b, b -> Future a b) -> Future a b
    bibind: function bibind(rejecter, resolver) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(left) {
          rejecter(left).fork(reject, resolve);
        }, function(right) {
          resolver(right).fork(reject, resolve);
        });
      });
    },

    // map :: Future a b -> (b -> c) -> Future a c
    map: function map(iterator) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(reject, function(right) {
          resolve(iterator(right));
        });
      });
    },

    // lmap :: Future a b -> (a -> c) -> Future c b
    lmap: function lmap(iterator) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(left) {
          reject(iterator(left));
        }, resolve);
      });
    },

    // bimap :: Future a b -> (a -> c, b -> d) -> Future c d
    bimap: function bimap(rejecter, resolver) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(left) {
          reject(rejecter(left));
        }, function(right) {
          resolve(resolver(right));
        });
      });
    },

    // fold :: Future a b -> (a -> c, b -> c) -> Future d c
    fold: function fold(rejecter, resolver) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(left) {
          resolve(rejecter(left));
        }, function(right) {
          resolve(resolver(right));
        });
      });
    },

    // lfold :: Future a b -> (a -> c, b -> c) -> Future c d
    lfold: function lfold(rejector, resolver) {
      var fork = this.fork;

      return new Future(function(reject) {
        fork(function(left) {
          reject(rejector(left));
        }, function(right) {
          reject(resolver(right));
        });
      });
    },

    // swap :: Future a b -> Future b a
    swap: function swap() {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(left) {
          resolve(left);
        }, reject);
      });
    },

    // ap :: Future a (b -> c) -> Future a b -> Future a c
    ap: function ap(future) {
      return this.bind(function(fn) {
        return future.map(fn);
      });
    },

    // concat :: Future a b -> Future a c -> Future a c
    concat: function concat(future) {
      return this.bind(function() {
        return future;
      });
    },

    // equals :: Future a b -> Future a b -> Bool
    equals: function(future) {
      return this === future;
    },

    exec: function exec() {
      this.fork(function(err) {
        throw err;
      }, function() {});
    }
  };

  proto.chain = proto.bind;
  proto.of = Future.of;

  return Future;
});
