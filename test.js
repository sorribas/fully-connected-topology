var tape = require('tape');
var topology = require('./');

tape('2 peers', function(t) {
  var t1 = topology('127.0.0.1:10002', ['127.0.0.1:10003']);
  var t2 = topology('127.0.0.1:10003', ['127.0.0.1:10002']);

  var missing = 2;
  var end = function() {
    t1.destroy();
    t2.destroy();
    t.end();
  };

  t1.once('connection', function(s, peer) {
    t.same(peer, '127.0.0.1:10003');
    if (!--missing) end();
  });

  t2.once('connection', function(s, peer) {
    t.same(peer, '127.0.0.1:10002');
    if (!--missing) end();
  });
});

tape('reconnects', function(t) {
  var t1 = topology('127.0.0.1:10002', ['127.0.0.1:10003']);
  var t2 = topology('127.0.0.1:10003', ['127.0.0.1:10002']);

  var missing = 3;
  var end = function() {
    t1.destroy();
    t2.destroy();
    t.end();
  };

  t1.on('connection', function(s, peer) {
    t.same(peer, '127.0.0.1:10003');
    if (--missing) return s.destroy();
    end();
  });
});