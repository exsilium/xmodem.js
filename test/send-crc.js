describe('XMODEM Send - crc', function() {
  it('rx should connect and start receiving', function(done) {
    this.timeout(60000);
    
    server.once('connection', function(socket) {
      var buffer = fs.readFileSync(sendFile);
      xmodem.send(socket, buffer);
    });
    
    const execFile = require('child_process').execFile;
  
    const child = execFile('rx', ['-X', '-c', '-a', '--tcp-client', tcpsocket_addr + ':' + tcpsocket_port, receiveFile], (error, stdout, stderr) => {
      if (error) {
        console.error('stderr', stderr);
        throw error;
      }
      assert.equal('connecting to [' + tcpsocket_addr + '] <' + tcpsocket_port + '>\n\n', stdout);
    });
    
    child.once('close', function(code) {
      assert.equal(0, code);
      done();
    });
  });
  
  it('receive file should exist', function(done) {
    assert.equal(true, fs.existsSync(receiveFile));
    done();
  });
  
  it('send and receive files should be identical', function() {
    const md5File = require('md5-file');
    assert.equal(md5File.sync(sendFile), md5File.sync(receiveFile));
  });
  
  it('receiveFile rm should return undefined', function(done) {
    assert.equal(undefined, fs.unlinkSync(receiveFile));
    done();
  });
  
  it('socket should have 0 connections', function(done) {
    assert.equal(0, server._connections);
    done();
  });
});