describe('XMODEM Cleanup', function() {
  it('unixsocket rm should return undefined if any', function(done) {
    if(fs.existsSync(unixsocket) === true) {
      assert.equal(undefined, fs.unlinkSync(unixsocket));
    }
    done();
  });
  
  it('receiveFile rm should return undefined if any', function(done) {
    if(fs.existsSync(receiveFile) === true) {
      assert.equal(undefined, fs.unlinkSync(receiveFile));
    }
    done();
  });
  
  it('sendFile rm should return undefined if any', function(done) {
    if(fs.existsSync(sendFile) === true) {
      assert.equal(undefined, fs.unlinkSync(sendFile));
    }
    done();
  });
});