// Copyright (c) 2014 Tenor Biel
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

;(function(root, factory) {
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
  Future.resolve = function resolve(a) {
    return new Future(function(reject, resolve) {
      resolve(a);
    });
  };

  // reject :: a -> Future a b
  Future.reject = function reject(b) {
    return new Future(function(reject, resolve) {
      resolve(b);
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
        argooments[index].fork(function(a) {
          if (!rejected) {
            rejected = true;
            reject(a);
          }
        }, function(b) {
          resolutions[index] = b;

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

  var proto = Future.prototype = {
    // bind :: Future a b -> (b -> Future a c) -> Future a c
    bind: function bind(binder) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          reject(a);
        }, function(b) {
          binder(b).fork(reject, resolve);
        });
      });
    },

    // lbind :: Future a b -> (a -> Future c b) -> Future c b
    lbind: function lbind(binder) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          binder(a).fork(reject, resolve);
        }, function(b) {
          resolve(b);
        });
      });
    },

    // bibind :: Future a b -> (a -> Future a b, b -> Future a b) -> Future a b
    bibind: function bibind(rejecter, resolver) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          rejecter(a).fork(reject, resolve);
        }, function(b) {
          resolver(b).fork(reject, resolve);
        });
      });
    },

    // map :: Future a b -> (b -> c) -> Future a c
    map: function map(iterator) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          reject(a);
        }, function(b) {
          resolve(iterator(b));
        });
      });
    },

    // lmap :: Future a b -> (a -> c) -> Future c b
    lmap: function lmap(iterator) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          reject(iterator(a));
        }, function(b) {
          resolve(b);
        });
      });
    },

    // bimap :: Future a b -> (a -> c, b -> d) -> Future c d
    bimap: function bimap(rejecter, resolver) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          reject(rejecter(a));
        }, function(b) {
          resolve(resolver(b));
        });
      });
    },

    // fold :: Future a b -> (a -> c, b -> c) -> Future d c
    fold: function fold(rejecter, resolver) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          resolve(rejecter(a));
        }, function(b) {
          resolve(resolver(b));
        });
      });
    },

    // lfold :: Future a b -> (a -> c, b -> c) -> Future c d
    lfold: function lfold(rejector, resolver) {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          reject(rejector(a));
        }, function(b) {
          reject(resolver(b));
        });
      });
    },

    // swap :: Future a b -> Future b a
    swap: function swap() {
      var fork = this.fork;

      return new Future(function(reject, resolve) {
        fork(function(a) {
          resolve(a);
        }, function(b) {
          reject(b);
        });
      });
    },

    // ap :: Future a (b -> c) -> Future a b -> Future a c
    ap: function ap(future) {
      return this.bind(function(iterator) {
        return future.map(iterator);
      });
    },

    // concat :: Future a b -> Future a c -> Future a c
    concat: function and(future) {
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
