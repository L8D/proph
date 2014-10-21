var test = require('tape');
var Future = require('../proph');

var rejection = 'reJECTED!';
var rejecter = Future.reject(rejection);

var resolution = 'A resolution!';
var resolver = Future.resolve(resolution);

function toUpperCase(str) {
  return str.toUpperCase();
};

test('Future#fork', function(t) {
  t.plan(2);

  resolver.fork(t.fail, function(msg) {
    t.equal(msg, resolution);
  });

  rejecter.fork(function(msg) {
    t.equal(msg, rejection);
  }, t.fail);
});

test('Future#exec', function(t) {
  t.plan(2);

  t.throws(function() {
    rejecter.exec();
  }, new RegExp('^' + rejection + '$'));

  t.doesNotThrow(function() {
    resolver.exec();
  });
});

test('Future#map', function(t) {
  t.plan(4);

  rejecter.map(toUpperCase).fork(function(msg) {
    t.equal(msg, rejection);
  }, t.fail);

  resolver.map(toUpperCase).fork(t.fail, function(msg) {
    t.equal(msg, toUpperCase(resolution));
  });

  t.test('Future#lmap', function(t) {
    t.plan(2);

    rejecter.lmap(toUpperCase).fork(function(msg) {
      t.equal(msg, toUpperCase(rejection));
    }, t.fail);

    resolver.lmap(toUpperCase).fork(t.fail, function(msg) {
      t.equal(msg, resolution);
    });
  });

  t.test('Future#bimap', function(t) {
    t.plan(2);

    rejecter.bimap(toUpperCase, t.fail).fork(function(msg) {
      t.equal(msg, toUpperCase(rejection));
    }, t.fail);

    resolver.bimap(t.fail, toUpperCase).fork(t.fail, function(msg) {
      t.equal(msg, toUpperCase(resolution));
    });
  });
});

test('Future#bind', function(t) {
  t.plan(5);

  rejecter.bind(t.fail).fork(function(msg) {
    t.equal(msg, rejection);
  }, t.fail);

  resolver.bind(function(msg) {
    return Future.resolve(toUpperCase(msg));
  }).fork(t.fail, function(msg) {
    t.equal(msg, toUpperCase(resolution));
  });

  resolver.bind(function(msg) {
    return Future.reject(toUpperCase(msg));
  }).fork(function(msg) {
    t.equal(msg, toUpperCase(resolution));
  }, t.fail);

  t.test('Future#lbind', function(t) {
    t.plan(3);

    rejecter.lbind(function(msg) {
      return Future.reject(toUpperCase(msg));
    }).fork(function(msg) {
      t.equal(msg, toUpperCase(rejection));
    }, t.fail);

    rejecter.lbind(function(msg) {
      return Future.resolve(toUpperCase(msg));
    }).fork(t.fail, function(msg) {
      t.equal(msg, toUpperCase(rejection));
    });

    resolver.lbind(t.fail).fork(t.tail, function(msg) {
      t.equal(msg, resolution);
    });
  });

  t.test('Future#bibind', function(t) {
    t.plan(4);

    rejecter.bibind(function(msg) {
      return Future.reject(toUpperCase(msg));
    }, t.fail).fork(function(msg) {
      t.equal(msg, toUpperCase(rejection));
    }, t.fail);

    rejecter.bibind(function(msg) {
      return Future.resolve(toUpperCase(msg));
    }, t.fail).fork(t.fail, function(msg) {
      t.equal(msg, toUpperCase(rejection));
    });

    resolver.bibind(t.fail, function(msg) {
      return Future.reject(toUpperCase(msg));
    }).fork(function(msg) {
      t.equal(msg, toUpperCase(resolution));
    }, t.fail);

    resolver.bibind(t.fail, function(msg) {
      return Future.resolve(toUpperCase(msg));
    }).fork(t.fail, function(msg) {
      t.equal(msg, toUpperCase(resolution));
    });
  });
});

test('Future#fold', function(t) {
  t.plan(3);

  rejecter.fold(toUpperCase, t.fail).fork(t.fail, function(msg) {
    t.equal(msg, toUpperCase(rejection));
  });

  resolver.fold(t.fail, toUpperCase).fork(t.fail, function(msg) {
    t.equal(msg, toUpperCase(resolution));
  });

  t.test('Future#lfold', function(t) {
    t.plan(2);

    rejecter.lfold(toUpperCase, t.fail).fork(function(msg) {
      t.equal(msg, toUpperCase(rejection));
    }, t.fail);

    resolver.lfold(t.fail, toUpperCase).fork(function(msg) {
      t.equal(msg, toUpperCase(resolution));
    }, t.fail);
  });
});

test('Future#swap', function(t) {
  t.plan(2);

  rejecter.swap().fork(t.fail, function(msg) {
    t.equal(msg, rejection);
  });

  resolver.swap().fork(function(msg) {
    t.equal(msg, resolution);
  }, t.fail);
});

test('Future#ap', function(t) {
  t.plan(2);

  var future = Future.resolve(toUpperCase);

  future.ap(rejecter).fork(function(msg) {
    t.equal(msg, rejection);
  }, t.fail);

  future.ap(resolver).fork(t.fail, function(msg) {
    t.equal(msg, toUpperCase(resolution));
  });
});
