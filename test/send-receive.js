/* Goal of this test suite is to have two separate instances
   one for receiving and one for sending. This test doesn't
   use external binaries.
 */
describe('XMODEM Send - Receive', function() {
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
      var buffer = fs.readFileSync(sendFile);
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
    assert.equal(md5File.sync(sendFile), md5File.sync(receiveFile));
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
  
  it('server should close', function(done) {
    server.once('close', function() {
      done();
    });
    
    server.close();
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
      var buffer = fs.readFileSync(sendFile);
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
    assert.equal(md5File.sync(sendFile), md5File.sync(receiveFile));
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
});