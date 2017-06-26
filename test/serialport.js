/*
 * Goal of this test suite is to test XModem transfer
 * using virtual serialport sockets created via socat
 * this suite only runs when the socat utility is available
 */
var commandExistsSync = require('command-exists').sync;

if(commandExistsSync('socat')) {
  describe('XMODEM Serialport sending - receiving', function() {
    const xmodemSend = require(libpath + '/index');
    const xmodemRecv = require(libpath + '/index');
    const serialport = require('serialport');
    var child;
    
    var sendPort = process.env.HOME + '/ttyXM01';
    var sPort;
    var recvPort = process.env.HOME + '/ttyXM02';
    var rPort;
    
    // Setting up virtual ports 
    
    it('setup pair of virtual serialports', function(done) {
      const spawn = require('child_process').spawn;
    
      child = spawn('socat', ['-d', '-d', 'pty,raw,echo=0,link=' + sendPort, 'pty,raw,echo=0,link=' + recvPort]);
      
      child.stderr.on('data', (data) => {
        // Socat returns the allocated PTY terminal references to stderr
        if(data.indexOf("starting data transfer loop with FDs") >= 0) {
          done();
        }
      });
    });
    
    it('sending port device node should exist', function(done) {
      assert.equal(true, fs.existsSync(sendPort));
      done();
    });
    
    it('receiving port device node should exist', function(done) {
      assert.equal(true, fs.existsSync(sendPort));
      done();
    });
    
    it('should be possible to open serialports', function(done) {
      sPort = new serialport(sendPort, { baudRate: 9600 });
      rPort = new serialport(recvPort, { baudRate: 9600 });
      
      sPort.once('open', function() {
        sPort.write('We only see what we know', function(err) {
          if (err) {
            return console.log('Error on write: ', err.message);
          }
        });
      });
      
      rPort.once('data', function (data) {
        assert.equal('We only see what we know', data);
        done();
      });
      
    });
    
    // Transfer (CRC)
    
    it('transfer should succeed - crc', function(done) {
      var buffer = fs.readFileSync(sendFile);
      xmodemSend.send(sPort, buffer);
      
      xmodemRecv.receive(rPort, receiveFile);
      
      rPort.once('close', function(err) {
        assert.equal(null, err);
        done();
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
    
    // Transfer (checksum)
    
    it('transfer should succeed - checksum', function(done) {
      this.timeout(60000);
      
      // Set receiver to normal mode
      xmodemRecv.XMODEM_OP_MODE = 'normal';
      assert(xmodemRecv.XMODEM_OP_MODE, 'normal');
      // Sender should still be in CRC mode from previous (default) transfer
      assert(xmodemSend.XMODEM_OP_MODE, 'crc');
      
      var buffer = fs.readFileSync(sendFile);
      xmodemSend.send(sPort, buffer);
      
      rPort.once('open', function() {
        xmodemRecv.receive(rPort, receiveFile);
      });
      
      rPort.once('close', function(err) {
        assert.equal(null, err);
        done();
      });
      
      rPort.open();
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
    
    
    // Cleaning up
    
    it('socat process should exit', function(done) {
      child.once('exit', function(code) {
        assert.equal(129, code);
        done();
      });
      child.kill('SIGHUP');
    });
    
    delete require.cache[require.resolve(libpath + '/index.js')];
  });
} // if(commandExistsSync('socat'))
