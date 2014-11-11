'use strict';

var describe = require('tape-bdd');
var Future = require('../proph');

var rejection = 'reJECTED!';
var rejecter = Future.reject(rejection);

var resolution = 'A resolution!';
var resolver = Future.resolve(resolution);

function toUpperCase(str) {
  return str.toUpperCase();
};

describe('fork', function(it) {
  it('should call resolver callback for resolved', function(assert) {
    resolver.fork(assert.fail, function(msg) {
      assert.equal(msg, resolution);
    });
  });

  it('should call rejecter callback for rejected', function(assert) {
    rejecter.fork(function(msg) {
      assert.equal(msg, rejection);
    }, assert.fail);
  });
});

describe('exec', function(it) {
  it('should throw when executing rejected', function(assert) {
    assert.throws(function() {
      rejecter.exec();
    }, new RegExp('^' + rejection + '$'));
  });

  it('should not throw when executing resolved', function(assert) {
    assert.doesNotThrow(function() {
      resolver.exec();
    });
  });
});

describe('map', function(it) {
  it('should not apply given func to rejected', function(assert) {
    rejecter.map(toUpperCase).fork(function(msg) {
      assert.equal(msg, rejection);
    }, assert.fail);
  });

  it('should apply given func to resolved', function(assert) {
    resolver.map(toUpperCase).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});

describe('lmap', function(it) {
  it('should apply given func to rejected', function(assert) {
    rejecter.lmap(toUpperCase).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should not apply given func to resolved', function(assert) {
    resolver.lmap(toUpperCase).fork(assert.fail, function(msg) {
      assert.equal(msg, resolution);
    });
  });
});

describe('bimap', function(it) {
  it('should apply first given func to rejected', function(assert) {
    rejecter.bimap(toUpperCase, assert.fail).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should apply second given func to resolved', function(assert) {
    resolver.bimap(assert.fail, toUpperCase).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});

describe('bind', function(it) {
  it('should not bind given func to rejected', function(assert) {
    rejecter.bind(assert.fail).fork(function(msg) {
      assert.equal(msg, rejection);
    }, assert.fail);
  });

  it('should bind given func from resolved to resolved', function(assert) {
    resolver.bind(function(msg) {
      return Future.resolve(toUpperCase(msg));
    }).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });

  it('should bind given func from rejected to resolved', function(assert) {
    resolver.bind(function(msg) {
      return Future.reject(toUpperCase(msg));
    }).fork(function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    }, assert.fail);
  });
});

describe('lbind', function(it) {
  it('should bind given func from rejected to rejected', function(assert) {
    rejecter.lbind(function(msg) {
      return Future.reject(toUpperCase(msg));
    }).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should bind given func from rejected to resolved', function(assert) {
    rejecter.lbind(function(msg) {
      return Future.resolve(toUpperCase(msg));
    }).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    });
  });

  it('should not bind given func to rejected', function(assert) {
    resolver.lbind(assert.fail).fork(assert.tail, function(msg) {
      assert.equal(msg, resolution);
    });
  });
});

describe('bibind', function(it) {
  it('should only bind first given func rejected->rejected', function(assert) {
    rejecter.bibind(function(msg) {
      return Future.reject(toUpperCase(msg));
    }, assert.fail).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should only bind first given func rejected->resolved', function(assert) {
    rejecter.bibind(function(msg) {
      return Future.resolve(toUpperCase(msg));
    }, assert.fail).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    });
  });

  it('should only bind first given func resolved->rejected', function(assert) {
    resolver.bibind(assert.fail, function(msg) {
      return Future.reject(toUpperCase(msg));
    }).fork(function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    }, assert.fail);
  });

  it('should only bind first given func resolved->resolved', function(assert) {
    resolver.bibind(assert.fail, function(msg) {
      return Future.resolve(toUpperCase(msg));
    }).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});

describe('fold', function(it) {
  it('should fold given func from rejected to resolved', function(assert) {
    rejecter.fold(toUpperCase, assert.fail).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    });
  });

  it('should fold given func from resolved to resolved', function(assert) {
    resolver.fold(assert.fail, toUpperCase).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});

describe('lfold', function(it) {
  it('should fold given func from rejected to rejected', function(assert) {
    rejecter.lfold(toUpperCase, assert.fail).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should fold given func from resolved to rejected', function(assert) {
    resolver.lfold(assert.fail, toUpperCase).fork(function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    }, assert.fail);
  });
});

describe('swap', function(it) {
  it('should swap rejected for resolved', function(assert) {
    rejecter.swap().fork(assert.fail, function(msg) {
      assert.equal(msg, rejection);
    });
  });

  it('should swap resolved for rejected', function(assert) {
    resolver.swap().fork(function(msg) {
      assert.equal(msg, resolution);
    }, assert.fail);
  });
});

describe('ap', function(it) {
  var future = Future.resolve(toUpperCase);

  it('should not apply purified func to rejected', function(assert) {
    future.ap(rejecter).fork(function(msg) {
      assert.equal(msg, rejection);
    }, assert.fail);
  });

  it('should apply purified func to resolved', function(assert) {
    future.ap(resolver).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});
