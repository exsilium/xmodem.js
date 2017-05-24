describe('XMODEM Receive', function() {
  server.on('connection', function(socket) {
    xmodem.receive(socket, receiveFile);
  });
  
  it('sx should connect and start sending', function() {
    const execFile = require('child_process').execFile;
  
    const child = execFile('sx', ['-X', '-b', '--tcp-client', tcpsocket_addr + ':' + tcpsocket_port, sendFile], (error, stdout, stderr) => {
      if (error) {
        console.error('stderr', stderr);
        throw error;
      }
      assert.equal('connecting to [' + tcpsocket_addr + '] <' + tcpsocket_port + '>\n\n', stdout);
    });  
  });
  
  it('receive file should exist', function(done) {
    this.timeout(5000);
    
    setTimeout(function () {
      assert.equal(true, fs.existsSync(receiveFile));
      done();
    }, 1000);
  });
  
  it('send and receive files should be identical', function() {
    const md5File = require('md5-file');
    assert.equal(md5File.sync(sendFile), md5File.sync(receiveFile));
  });
});