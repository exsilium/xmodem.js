var assert = require('assert');
var xmodem = require('../lib/index');

var net = require('net');
var fs = require('fs');
var unixsocket = '/tmp/xmodem.sock';

describe('XMODEM', function() {
  describe('Version check', function() {
    it('should return 0.0.1', function() {
      assert.equal('0.0.1', xmodem.VERSION);
    });
  });

  describe('Setup Sender Server', function() {
    var server = net.createServer();
    server.listen(unixsocket);

    server.on('listening', function() {
      var ad = server.address();
      if (typeof ad === 'string') {
        console.log('[server on listening] %s', ad);
      } else {
        console.log('[server on listening] %s:%s using %s', ad.address, ad.port, ad.family);
      }
    });
  });

  describe('Cleanup socket', function() {
    if(fs.existsSync(unixsocket) === true) {
      it('should return undefined', function() {
        assert.equal(undefined, fs.unlinkSync(unixsocket));
      });
    }
  })
});