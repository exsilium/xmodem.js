describe('XMODEM Receive', function() {
  const server = net.createServer();
  
  it('sx should connect and start sending', function(done) {
    this.timeout(5000);
    
    if(tcpsocket_enable) {
      server.listen(tcpsocket_port, tcpsocket_addr);
    }
    else {
      server.listen(unixsocket);  
    }
    
    server.once('connection', function(socket) {
      xmodem.receive(socket, receiveFile);
    });
    
    const execFile = require('child_process').execFile;
  
    const child = execFile('sx', ['-X', '-b', '--tcp-client', tcpsocket_addr + ':' + tcpsocket_port, sendFile], (error, stdout, stderr) => {
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
});