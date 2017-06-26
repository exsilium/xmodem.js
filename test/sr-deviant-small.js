/* Goal of this test suite is to have transfers using
 * non-standard block size (Smaller than the default 128)
 * For real life use, the XBee radios by digi.com use
 * XMODEM protocol with 64 byte block size
 */
describe('XMODEM Send - Receive - Deviant Block (64 bytes)', function() {
  var xmodemSend = require(libpath + '/index');
  var xmodemRecv = require(libpath + '/index');

  const net = require('net');
  const client = new net.Socket();
  const server = net.createServer();

  xmodemSend.block_size = 64;
  xmodemRecv.block_size = 64;

  it('using non-standard block size of 64 bytes', function() {
    assert.equal(xmodemSend.block_size, 64);
    assert.equal(xmodemRecv.block_size, 64);
  });

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