describe('XMODEM Send - repeat EOT', function() {
  var xmodem = require(libpath + '/index');
  const net = require('net');
  const server = net.createServer();
  const client = new net.Socket();
  
  const ACK = new Buffer([ 0x06 ]);
  const NAK = new Buffer([ 0x15 ]);
  const EOT = new Buffer([ 0x04 ]);
  
  it('after transfer we should receive EOT until we ACK', function(done) {
    this.timeout(60000);
    
    server.once('listening', function() {
      client.connect(tcpsocket_port, tcpsocket_addr, function() {
	      client.write(NAK);
      });

      client.once('data', function(data) {
        
        // We receive the test payload, that we ACK

	      client.once('data', function(data) {
	        assert.deepEqual(data, EOT); // First EOT, we reply with NAK
	        
	        client.once('data', function(data) {
	          assert.deepEqual(data, EOT); // Second EOT, we reply with NAK
	          
	          client.once('data', function(data) {
	            assert.deepEqual(data, EOT); // Third EOT, we reply with ACK
	            client.write(ACK);
	            client.destroy();
	            done();
	          });
	          client.write(NAK);
	        });
	        client.write(NAK);
	      });
	      client.write(ACK);
      });
    });
    
    if(tcpsocket_enable) {
      server.listen(tcpsocket_port, tcpsocket_addr);
    }
    else {
      server.listen(unixsocket);  
    }
    
    server.once('connection', function(socket) {
      var buffer = fs.readFileSync(sendFile);
      
      xmodem.once('ready', function(bufferLength) {
        assert.equal(1, bufferLength);
      });
      
      xmodem.once('start', function(mode) {
        assert.equal('normal', mode);
      });
      
      xmodem.on('status', function(data) {
        if(data.action === 'send' && data.signal === 'SOH') {
          assert.equal(1, data.block);
        }
        else if(data.action === 'send') {
          assert.equal('EOT', data.signal);
        }
      });
      
      xmodem.once('stop', function(code) {
        assert.equal(0, code);
      });
      
      xmodem.send(socket, buffer);
    });
    
    
  });
  
  it('socket should have 0 connections', function(done) {
    assert.equal(0, server._connections);
    done();
  });
  
  it('server should close', function(done) {
    server.once('close', function() {
      done();
    });
    
    delete require.cache[require.resolve('net')];  
    server.close();
  });
  
  delete require.cache[require.resolve(libpath + '/index.js')];
});