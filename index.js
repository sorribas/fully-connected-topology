var net = require('net');
var events = require('events');
var util = require('util');
var networkAddress = require('network-address');
var lpmessage = require('length-prefixed-message');

var attachCleanup = function(self, peer, socket) {
  socket.on('close', function() {
    if (peer.socket === socket) peer.socket = null;
    if (peer.pendingSocket === socket) peer.pendingSocket = null;
    if (peer.socket) return;

    if (!peer.host) return delete self.peers[peer.id];

    var reconnect = function() {
      connect(self, peer);
    };

    peer.retries++;
    peer.reconnectTimeout = setTimeout(reconnect, (1 << peer.retries) * 250);
    self.emit('reconnect', peer.id, peer.retries);
  });
};

var errorHandle = function(self, socket) {
  socket.on('error', function() {
    socket.destroy();
  });

  socket.setTimeout(15000, function() { // 15s to do the handshake
    socket.destroy();
  });
};

var onready = function(self, peer, socket) {
  socket.setTimeout(0); // reset timeout
  var oldSocket = peer.socket;
  peer.retries = 0;
  peer.socket = socket;
  peer.pendingSocket = null;
  if (oldSocket) oldSocket.destroy();
  self.emit('connection', peer.socket, peer.id);
};

var onconnection = function(self, socket) {
  errorHandle(self, socket);
  lpmessage.read(socket, function(from) {
    from = from.toString();

    var peer = self.peers[from] = self.peers[from] || {id:from};
    if (from > self.me) return connect(self, peer, socket);

    lpmessage.write(socket, self.me);
    attachCleanup(self, peer, socket);
    onready(self, peer, socket);
  });
};

var connect = function(self, peer, socket) {
  if (peer.socket || peer.pendingSocket) return socket && socket.destroy();
  if (peer.reconnectTimeout) clearTimeout(peer.reconnectTimeout);

  if (!socket) socket = net.connect(peer.port, peer.host);
  lpmessage.write(socket, self.me);
  peer.pendingSocket = socket;

  if (self.me > peer.id) return onconnection(self, socket);

  errorHandle(self, socket);
  attachCleanup(self, peer, socket);

  lpmessage.read(socket, function() {
    onready(self, peer, socket);
  });
};

var Topology = function(me, peers) {
  if (!(this instanceof Topology)) return new Topology(me, peers);
  if (/^\d+$/.test(me)) me = networkAddress()+':'+me;

  this.me = me || '';
  this.peers = {};
  this.server = null;

  if (this.me) this.listen(Number(me.split(':')[1]));

  events.EventEmitter.call(this);

  if (peers) [].concat(peers).forEach(this.add.bind(this));
};

util.inherits(Topology, events.EventEmitter);

Topology.prototype.__defineGetter__('connections', function() {
  var peers = this.peers;
  return Object.keys(peers)
    .map(function(id) {
      return peers[id].socket;
    })
    .filter(function(socket) {
      return socket;
    });
});

Topology.prototype.peer = function(addr) {
  return (this.peers[addr] && this.peers[addr].socket) || null;
};

Topology.prototype.listen = function(port) {
  var self = this;

  this.server = net.createServer(function(socket) {
    onconnection(self, socket);
  });

  this.server.listen(port);
};

Topology.prototype.add = function(addr) {
  if (addr === this.me) return;

  var host = addr.split(':')[0];
  var port = Number(addr.split(':')[1]);
  var peer = this.peers[addr] = this.peers[addr] || {id:addr};

  peer.host = host;
  peer.port = port;
  peer.retries = 0;
  peer.reconnectTimeout = peer.reconnectTimeout || null;
  peer.pendingSocket = peer.pendingSocket || null;
  peer.socket = peer.socket || null;

  connect(this, peer);
};

Topology.prototype.remove = function(addr) {
  if (addr === this.me) return;

  var peer = this.peers[addr];
  if (!peer) return;

  delete this.peers[addr];
  peer.host = null; // will stop reconnects
  if (peer.socket) peer.socket.destroy();
  if (peer.pendingSocket) peer.pendingSocket.destroy();
  clearTimeout(peer.reconnectTimeout);
};

Topology.prototype.destroy = function() {
  if (this.server) this.server.close();
  Object.keys(this.peers).forEach(this.remove.bind(this));
};

module.exports = Topology;
