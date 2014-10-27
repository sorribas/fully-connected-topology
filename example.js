var topology = require('./');

var t1 = topology('127.0.0.1:4001', ['127.0.0.1:4002', '127.0.0.1:4003']);
var t2 = topology('127.0.0.1:4002', ['127.0.0.1:4001', '127.0.0.1:4003']);
var t3 = topology('127.0.0.1:4003', ['127.0.0.1:4001', '127.0.0.1:4002']);

t1.on('connection', function(connection, peer) {
  console.log('t1 is connected to', peer);
});

t2.on('connection', function(connection, peer) {
  console.log('t2 is connected to', peer);
});

t3.on('connection', function(connection, peer) {
  console.log('t3 is connected to', peer);
});