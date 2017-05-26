/* Globals */
assert = require('chai').assert;
fs = require('fs');

unixsocket = '/tmp/xmodem.sock';
tcpsocket_addr = '127.0.0.1';
tcpsocket_port = 33949;
tcpsocket_enable = true;
receiveFile = '/tmp/xmodem.file.receive';
sendFile = '/tmp/xmodem.file.send';
/* End of Globals */

describe('XMODEM Basic', function() {
  var xmodem = require('../lib/index');
  describe('Version check', function() {
    it('should return 0.0.1', function() {
      assert.equal('0.0.1', xmodem.VERSION);
    });
  });

  describe('Setup Server', function() {
    const net = require('net');
    const server = net.createServer();
    
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
    
    it('should have 0 connections', function(done) {
        assert.equal(0, server._connections);
        done();
    });
    
    if (typeof ad === 'string') {
      it('should have unix socket address', function(done) {
        assert.equal(unixsocket, ad);
        done();
      });
    } else {
      it('should have tcp socket address', function(done) {
        assert.equal(tcpsocket_addr, ad.address);
        done();
      });
      it('should have tcp socket port', function(done) {
        assert.equal(tcpsocket_port, ad.port);
        done();
      });
      it('should be IPv4 family', function(done) {
        assert.equal('IPv4', ad.family);
        done();
      });
    }
    
    it('server should close', function(done) {
      server.once('close', function() {
        done();
      });
      
      server.close();
      delete require.cache[require.resolve('net')];
    });
    
  });
  
  describe('Basic send/recv support', function() {
    it('sending file should exist', function(done) {
      fs.writeFileSync(sendFile, 'Test123');
      assert.equal(true, fs.existsSync(sendFile));
      done();
    });
    
    /* When lrzsz is installed via brew on Mac, only rz/sz
     * binaries are available!
     */
    it('sz should exist', function(done) {
      const execFile = require('child_process').execFile;
  
      const child = execFile('sz', ['--version'], (error, stdout, stderr) => {
        if (error) {
          console.error('stderr', stderr);
          throw error;
        }
        assert.include(stdout, 'sz');
        assert.include(stdout, 'lrzsz');
      }); 
      
      child.once('close', function(code) {
        assert.equal(0, code);
        done();
      });
    });
    
    it('rz should exist', function(done) {
      const execFile = require('child_process').execFile;
  
      const child = execFile('rz', ['--version'], (error, stdout, stderr) => {
        if (error) {
          console.error('stderr', stderr);
          throw error;
        }
        assert.include(stdout, 'rz');
        assert.include(stdout, 'lrzsz');
      });
      
      child.once('close', function(code) {
        assert.equal(0, code);
        done();
      });
    });
  });
  
  delete require.cache[require.resolve('../lib/index.js')];
});