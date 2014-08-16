var net = require('net');
var events = require('events');
var lengthPrefixedMessages = require('length-prefixed-message');
var once = require('once');
var networkAddress = require('network-address');

var create = function(myAddr, addreses) {

  var that = new events.EventEmitter();

  var connections = {};
  var lpm = lengthPrefixedMessages({length: 2});

  if (typeof myAddr === 'number' || !~myAddr.indexOf(':')) {
    myAddr = networkAddress() + ':' + myAddr;
  }
  var myAddrSplit = myAddr.split(':');
  addreses =  addreses || [];

  var server = net.createServer(function(socket) {
    lpm.read(socket, function(buf) {
      var addr = buf.toString();
      newConnection(socket, addr);
    });
  });
  server.listen(myAddrSplit[1], myAddrSplit[0]);

  var newConnection = function(socket, addr) {
    if (connections[addr]) connections[addr].destroy();
    connections[addr] = socket;
    that.emit('connection', socket, addr);
  };

  var connect = function(host, port) {
    var socket = net.connect(port, host);
    var addr = host + ':' + port;

    lpm.write(socket, myAddr);
    socket.on('connect', function() {
      newConnection(socket, addr);
    });

    var onclose = once(function() {
      if (connections[addr] !== socket) return;
      delete connections[addr];
    });

    socket.on('error', onclose);
    socket.on('close', onclose);
  };

  var update = function() {
    addreses.forEach(function(addr) {
      if (addr !== myAddr && !connections[addr]) {
        var splitAddr = addr.split(':');
        var host = splitAddr[0];
        var port = splitAddr[1];
        connect(host, port);
      }
    });
  };

  update();
  setInterval(update, 1000);

  return that;
};

module.exports = create;
