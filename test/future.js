'use strict';
/* global it, describe */

var Future = require('../proph');
var assert = require('assert');

var rejection = 'reJECTED!';
var rejecter = Future.reject(rejection);

var resolution = 'A resolution!';
var resolver = Future.resolve(resolution);

function toUpperCase(str) {
  return str.toUpperCase();
}

describe('fork', function() {
  it('should call resolver callback for resolved', function() {
    resolver.fork(assert.fail, function(msg) {
      assert.equal(msg, resolution);
    });
  });

  it('should call rejecter callback for rejected', function() {
    rejecter.fork(function(msg) {
      assert.equal(msg, rejection);
    }, assert.fail);
  });
});

describe('exec', function() {
  it('should throw when executing rejected', function() {
    assert.throws(function() {
      rejecter.exec();
    }, new RegExp('^' + rejection + '$'));
  });

  it('should not throw when executing resolved', function() {
    assert.doesNotThrow(function() {
      resolver.exec();
    });
  });
});

describe('map', function() {
  it('should not apply given func to rejected', function() {
    rejecter.map(toUpperCase).fork(function(msg) {
      assert.equal(msg, rejection);
    }, assert.fail);
  });

  it('should apply given func to resolved', function() {
    resolver.map(toUpperCase).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});

describe('lmap', function() {
  it('should apply given func to rejected', function() {
    rejecter.lmap(toUpperCase).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should not apply given func to resolved', function() {
    resolver.lmap(toUpperCase).fork(assert.fail, function(msg) {
      assert.equal(msg, resolution);
    });
  });
});

describe('bimap', function() {
  it('should apply first given func to rejected', function() {
    rejecter.bimap(toUpperCase, assert.fail).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should apply second given func to resolved', function() {
    resolver.bimap(assert.fail, toUpperCase).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});

describe('bind', function() {
  it('should not bind given func to rejected', function() {
    rejecter.bind(assert.fail).fork(function(msg) {
      assert.equal(msg, rejection);
    }, assert.fail);
  });

  it('should bind given func from resolved to resolved', function() {
    resolver.bind(function(msg) {
      return Future.resolve(toUpperCase(msg));
    }).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });

  it('should bind given func from rejected to resolved', function() {
    resolver.bind(function(msg) {
      return Future.reject(toUpperCase(msg));
    }).fork(function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    }, assert.fail);
  });
});

describe('lbind', function() {
  it('should bind given func from rejected to rejected', function() {
    rejecter.lbind(function(msg) {
      return Future.reject(toUpperCase(msg));
    }).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should bind given func from rejected to resolved', function() {
    rejecter.lbind(function(msg) {
      return Future.resolve(toUpperCase(msg));
    }).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    });
  });

  it('should not bind given func to rejected', function() {
    resolver.lbind(assert.fail).fork(assert.tail, function(msg) {
      assert.equal(msg, resolution);
    });
  });
});

describe('bibind', function() {
  it('should only bind first given func rejected->rejected', function() {
    rejecter.bibind(function(msg) {
      return Future.reject(toUpperCase(msg));
    }, assert.fail).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should only bind first given func rejected->resolved', function() {
    rejecter.bibind(function(msg) {
      return Future.resolve(toUpperCase(msg));
    }, assert.fail).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    });
  });

  it('should only bind first given func resolved->rejected', function() {
    resolver.bibind(assert.fail, function(msg) {
      return Future.reject(toUpperCase(msg));
    }).fork(function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    }, assert.fail);
  });

  it('should only bind first given func resolved->resolved', function() {
    resolver.bibind(assert.fail, function(msg) {
      return Future.resolve(toUpperCase(msg));
    }).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});

describe('fold', function() {
  it('should fold given func from rejected to resolved', function() {
    rejecter.fold(toUpperCase, assert.fail).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    });
  });

  it('should fold given func from resolved to resolved', function() {
    resolver.fold(assert.fail, toUpperCase).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});

describe('lfold', function() {
  it('should fold given func from rejected to rejected', function() {
    rejecter.lfold(toUpperCase, assert.fail).fork(function(msg) {
      assert.equal(msg, toUpperCase(rejection));
    }, assert.fail);
  });

  it('should fold given func from resolved to rejected', function() {
    resolver.lfold(assert.fail, toUpperCase).fork(function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    }, assert.fail);
  });
});

describe('swap', function() {
  it('should swap rejected for resolved', function() {
    rejecter.swap().fork(assert.fail, function(msg) {
      assert.equal(msg, rejection);
    });
  });

  it('should swap resolved for rejected', function() {
    resolver.swap().fork(function(msg) {
      assert.equal(msg, resolution);
    }, assert.fail);
  });
});

describe('ap', function() {
  var future = Future.resolve(toUpperCase);

  it('should not apply purified func to rejected', function() {
    future.ap(rejecter).fork(function(msg) {
      assert.equal(msg, rejection);
    }, assert.fail);
  });

  it('should apply purified func to resolved', function() {
    future.ap(resolver).fork(assert.fail, function(msg) {
      assert.equal(msg, toUpperCase(resolution));
    });
  });
});
