describe('XMODEM Cleanup', function() {
  this.timeout(5000);
  setTimeout(function() { 
    if(fs.existsSync(unixsocket) === true) {
      it('unixsocket rm should return undefined', function(done) {
        assert.equal(undefined, fs.unlinkSync(unixsocket));
        done();
      });
    }
    if(fs.existsSync(receiveFile) === true) {
      it('receiveFile rm should return undefined', function(done) {
        assert.equal(undefined, fs.unlinkSync(receiveFile));
        done();
      });
    }
    if(fs.existsSync(sendFile) === true) {
      it('sendFile rm should return undefined', function(done) {
        assert.equal(undefined, fs.unlinkSync(sendFile));
        done();
      });
    }
  }, 1000);
});