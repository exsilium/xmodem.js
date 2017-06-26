/* Goal of this test suite is to test with a bigger payload. A big payload is
 * defined as something that requires more than 255 blocks to be sent.
 */
describe('Big payload', function() {
  var nrOfBlocks = 256;
  var length = Math.max(1, (128*nrOfBlocks)<<0);
	var buf = new Buffer(length),
		  i = 0;

	for (; i < length; ++i) {
		buf[i] = (Math.random() * 0xFF)<<0;
	}
	
	// Prep sending data
	
  it('random payload should be 32768 bytes', function(done) {
    assert.equal(32768, buf.length);
    done();
  });
  
  it('big payload file should exist', function(done) {
    fs.writeFileSync(sendFile + 'big', buf);
    assert.equal(true, fs.existsSync(sendFile + 'big'));
    done();
  });
  
  it('big payload file should be 32768 bytes', function(done) {
    assert.equal(32768, fs.statSync(sendFile + 'big').size);
    done();
  });
  
  // Transfer - crc
  
  var xmodemSend = require(libpath + '/index');
  var xmodemRecv = require(libpath + '/index');
  const net = require('net');
  const client = new net.Socket();
  const server = net.createServer();
  
  it('send to self - crc', function(done) {
    this.timeout(60000);

    server.once('listening', function (socket) {
      client.connect(tcpsocket_port, tcpsocket_addr, function() {
        xmodemRecv.receive(client, receiveFile);
      });

      client.once('close', function() {
        done();
      });
    });

    if(tcpsocket_enable) {
      server.listen(tcpsocket_port, tcpsocket_addr);
    }
    else {
      server.listen(unixsocket);
    }

    server.once('connection', function(socket) {
      var buffer = fs.readFileSync(sendFile + 'big');
      xmodemSend.send(socket, buffer);
    });

  });

  it('receive file should exist', function(done) {
    setTimeout(function() {
      assert.equal(true, fs.existsSync(receiveFile));
      done();
    }, 100);
  });

  it('send and receive files should be identical', function(done) {
    const md5File = require('md5-file');
    assert.equal(md5File.sync(sendFile + 'big'), md5File.sync(receiveFile));
    done();
  });

  it('receiveFile rm should return undefined', function(done) {
    assert.equal(undefined, fs.unlinkSync(receiveFile));
    done();
  });

  it('socket should have 0 connections', function(done) {
    assert.equal(0, server._connections);
    done();
  });

  // Checksum send-receive

  it('send to self - checksum', function(done) {
    this.timeout(60000);

    // Set receiver to normal mode
    xmodemRecv.XMODEM_OP_MODE = 'normal';
    assert(xmodemRecv.XMODEM_OP_MODE, 'normal');
    // Sender should still be in CRC mode from previous (default) transfer
    assert(xmodemSend.XMODEM_OP_MODE, 'crc');

    server.once('listening', function (socket) {
      client.connect(tcpsocket_port, tcpsocket_addr, function() {
        xmodemRecv.receive(client, receiveFile);
      });

      client.once('close', function() {
        done();
      });
    });

    if(tcpsocket_enable) {
      server.listen(tcpsocket_port, tcpsocket_addr);
    }
    else {
      server.listen(unixsocket);
    }

    server.once('connection', function(socket) {
      var buffer = fs.readFileSync(sendFile + 'big');
      xmodemSend.send(socket, buffer);
    });

  });

  it('receive file should exist', function(done) {
    setTimeout(function() {
      assert.equal(true, fs.existsSync(receiveFile));
      done();
    }, 100);
  });

  it('send and receive files should be identical', function(done) {
    const md5File = require('md5-file');
    assert.equal(md5File.sync(sendFile + 'big'), md5File.sync(receiveFile));
    done();
  });

  it('receiveFile rm should return undefined', function(done) {
    assert.equal(undefined, fs.unlinkSync(receiveFile));
    done();
  });

  it('socket should have 0 connections', function(done) {
    assert.equal(0, server._connections);
    done();
  });

  it('sender xmodem should be in normal mode', function(done) {
    assert.equal(xmodemSend.XMODEM_OP_MODE, 'normal');
    done();
  });

  // End

  it('server should close', function(done) {
    server.once('close', function() {
      done();
    });

    delete require.cache[require.resolve('net')];
    server.close();
  });

  delete require.cache[require.resolve(libpath + '/index.js')];
  
  // Payload Cleanup
  
  it('big payload rm should return undefined if any', function(done) {
    if(fs.existsSync(sendFile + 'big') === true) {
      assert.equal(undefined, fs.unlinkSync(sendFile + 'big'));
    }
    done();
  });
});
 