/* Globals */
assert = require('assert');
xmodem = require('../lib/index');

net = require('net');
fs = require('fs');

server = null;
unixsocket = '/tmp/xmodem.sock';
tcpsocket_addr = '127.0.0.1';
tcpsocket_port = 33949;
tcpsocket_enable = true;
receiveFile = '/tmp/xmodem.file.receive';
sendFile = '/tmp/xmodem.file.send';
/* End of Globals */

describe('XMODEM Basic', function() {
  describe('Version check', function() {
    it('should return 0.0.1', function() {
      assert.equal('0.0.1', xmodem.VERSION);
    });
  });

  describe('Setup Server', function() {
    server = net.createServer();
    
    if(tcpsocket_enable) {
      server.listen(tcpsocket_port, tcpsocket_addr);
    }
    else {
      server.listen(unixsocket);  
    }
    
    var ad = null;
    server.on('listening', function() {
      ad = server.address();
    });
    
    it('should have 0 connections', function() {
        assert.equal(0, server._connections);
    });
    
    if (typeof ad === 'string') {
      it('should have unix socket address', function() {
        assert.equal(unixsocket, ad);
      });
    } else {
      it('should have tcp socket address', function() {
        assert.equal(tcpsocket_addr, ad.address);
      });
      it('should have tcp socket port', function() {
        assert.equal(tcpsocket_port, ad.port);
      });
      it('should be IPv4 family', function() {
        assert.equal('IPv4', ad.family);
      });
    }
  });
  
  describe('Basic send content', function() {
    it('sending file should exist', function() {
      fs.writeFileSync(sendFile, 'Test123');
      assert.equal(true, fs.existsSync(sendFile));
    });
  });
});