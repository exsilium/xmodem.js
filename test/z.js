describe('XMODEM Cleanup', function() {
  it('should have 0 connections', function() {
    assert.equal(0, server._connections);
  });
  if(fs.existsSync(unixsocket) === true) {
    it('unixsocket rm should return undefined', function() {
      assert.equal(undefined, fs.unlinkSync(unixsocket));
    });
  }
  if(fs.existsSync(receiveFile) === true) {
    it('receiveFile rm should return undefined', function() {
      assert.equal(undefined, fs.unlinkSync(receiveFile));
    });
  }
  if(fs.existsSync(sendFile) === true) {
    it('sendFile rm should return undefined', function() {
      assert.equal(undefined, fs.unlinkSync(sendFile));
    });
  }
});