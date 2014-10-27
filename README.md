fully-connected-topology
========================

Node module to create a network with a fully connected topology.

```
npm install fully-connected-topology
```

## Usage

``` js
var topology = require('fully-connected-topology');

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
```

If you run the above example it should print that everyone is connected to everyone.
If a connection is destroyed the topology will try to reconnect it.

## API

#### `var t = topology(ownHost, [peer1, peer2, ...])`

Creates a new topology. A local server will be started on the port specified in `ownHost`.

#### `t.add(peer)`

Add a peer after the topology has been created

#### `t.remove(peer)`

Remove a peer after the topology has been created

#### `t.destroy()`

Destroy the topology and all current connections

#### `var socket = t.peer(addr)`

Get the socket for a specific peer. Returns `null` if peer isn't connected.

#### `t.connections`

An array of all the current connections

#### `t.on('connection', function(connection, peer) {})`

Emitted when a new connection is established.

## License

MIT