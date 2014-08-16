var fc = require('./');
var networkAddress = require('network-address');
var addr = networkAddress();
var hosts = [addr + ':4500', addr + ':4501', addr + ':4502'];

var network = fc(process.argv[2], hosts);

network.on('connection', function(sock) {
  sock.on('data', function(data) {
    console.log(data.toString());
    if (data.toString().indexOf('ADD:') === 0) network.add(data.toString().substr(4));
  });

  var myAddr = addr + ':' + process.argv[2];
  if (!~hosts.indexOf(myAddr)) {
    sock.write('ADD:' + myAddr);
    network.add(myAddr);
  }
});
