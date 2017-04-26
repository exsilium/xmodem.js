var fs = require('fs');
var crc = require('crc');

const SOH = 0x01;
const EOT = 0x04;
const ACK = 0x06;
const NAK = 0x15;
const CAN = 0x18; // not implemented
const FILLER = 0x1A;
const CRC_MODE = 0x43; // 'C'

var receive_interval_timer = false;

var Xmodem = function () {};

Xmodem.prototype.VERSION = require('../package.json').version;

Xmodem.prototype.XMODEM_MAX_TIMEOUTS = 5;  // how many timeouts in a row before the sender gives up?
Xmodem.prototype.XMODEM_MAX_ERRORS = 10;   // how many errors on a single block before the receiver gives up?
Xmodem.prototype.XMODEM_CRC_ATTEMPTS = 3;  // how many times should receiver attempt to use CRC?
Xmodem.prototype.XMODEM_OP_MODE = 'crc';   // Try to use XMODEM-CRC extension or not?
Xmodem.prototype.timeout_seconds = 10;     // default timeout period
Xmodem.prototype.block_size = 128;         // how many bytes (excluding header & checksum) in each block?

// We expect a connected net.Socket() to listen/write to and a Buffer with data to send
Xmodem.prototype.send = function(socket, dataBuffer) {
  var blockNumber = 0;
  var packagedBuffer = new Array();
  var current_block = new Buffer(this.block_size);
  var sent_eof = false;
  var _self = this;
  
  this.log(dataBuffer.length);
  
  private_stuff();
  
  while (dataBuffer.length > 0) {
    for(i=0; i < this.block_size; i++) {
      current_block[i] = dataBuffer[i] === undefined ? FILLER : dataBuffer[i];
    }
    dataBuffer = dataBuffer.slice(this.block_size);
    packagedBuffer.push(current_block);
    current_block = new Buffer(this.block_size);
  }

  socket.on('data', function(data) {
    if(data[0] === CRC_MODE && blockNumber === 0) {
      console.log("[SEND] - received C byte!");
      if(packagedBuffer.length > blockNumber) {
        sendBlock(socket, blockNumber, packagedBuffer[blockNumber], _self.XMODEM_OP_MODE);
        blockNumber++;
      }
    }
    else if(data[0] === NAK && blockNumber === 0) {
      current_block.log("[SEND] - received NAK byte!");
      _self.XMODEM_OP_MODE = 'normal';
      if(packagedBuffer.length > blockNumber) {
        sendBlock(socket, blockNumber, packagedBuffer[blockNumber], _self.XMODEM_OP_MODE);
        blockNumber++;
      }
    }
    else if(data[0] === ACK && blockNumber > 0) {
      // Woohooo we are ready to send the next block! :)
      console.log('ACK RECEIVED');
      if(packagedBuffer.length > blockNumber) {
        sendBlock(socket, blockNumber, packagedBuffer[blockNumber], _self.XMODEM_OP_MODE);
        blockNumber++;
      }
      else if(packagedBuffer.length === blockNumber) {
        // We are EOT
        if(sent_eof === false) {
          sent_eof = true;
          console.log("WE HAVE RUN OUT OF STUFF TO SEND, EOT EOT!");
          socket.write(new Buffer([EOT]));
        }
        else {
          // We are finished!
          console.log('[SEND] - Finished!');
        }
      }
    }
    else if(data[0] === NAK && blockNumber > 0) {
      console.log('[SEND] - Packet corruption detected, resending previous block.');
      blockNumber--;
      if(packagedBuffer.length > blockNumber) {
        sendBlock(socket, blockNumber, packagedBuffer[blockNumber], _self.XMODEM_OP_MODE);
        blockNumber++;
      }
    }
  });
  
};

Xmodem.prototype.receive = function(socket, filename) {
  var blockNumber = 0;
  var packagedBuffer = new Array();
  var nak_tick = this.XMODEM_MAX_ERRORS * this.timeout_seconds * 3;
  var crc_tick = this.XMODEM_CRC_ATTEMPTS;
  var transfer_initiated = false;
  var _self = this;

  // Let's try to initate transfer with XMODEM-CRC
  if(this.XMODEM_OP_MODE === 'crc') {
    console.log("CRC init sent");
    socket.write(new Buffer([CRC_MODE]));
    receive_interval_timer = setIntervalX(function () {
      if (transfer_initiated === false) {
        console.log("CRC init sent");
        socket.write(new Buffer([CRC_MODE]));
      }
      else {
        clearInterval(receive_interval_timer);
        receive_interval_timer = false;
      }
      // Fallback to standard XMODEM
      if (receive_interval_timer === false && transfer_initiated === false) {
        receive_interval_timer = setIntervalX(function () {
          console.log("NAK init sent");
          socket.write(new Buffer([NAK]));
          _self.XMODEM_OP_MODE = 'normal';
        }, 3000, nak_tick);
      }
    }, 3000, (crc_tick - 1));
  }
  else {
    receive_interval_timer = setIntervalX(function () {
      console.log("NAK init sent");
      socket.write(new Buffer([NAK]));
      _self.XMODEM_OP_MODE = 'normal';
    }, 3000, nak_tick);
  }
  
  socket.on('data', function(data) {
    console.log('[RECV] - Received: ' + data.toString('utf-8'));
    console.log(data);
    if(data[0] === NAK && blockNumber === 0) {
      console.log("[RECV] - received NAK byte!");
    }
    else if(data[0] === SOH) {
      if(transfer_initiated === false) {
        // Initial byte received
        transfer_initiated = true;
        clearInterval(receive_interval_timer);
        receive_interval_timer = false;
      }

      receiveBlock(socket, blockNumber, data, _self.XMODEM_OP_MODE, function(current_block) {
        console.log(current_block);
        if(current_block.length === _self.block_size) {
         packagedBuffer.push(current_block);
         blockNumber++;
        }
      });
    }
    else if(data[0] === EOT) {
      socket.write(new Buffer([ACK]));
      blockNumber--;
      for(i = 0; i < packagedBuffer[blockNumber].length; i++) {
        if(packagedBuffer[blockNumber][i] === FILLER) {
          packagedBuffer[blockNumber] = packagedBuffer[blockNumber].slice(0, i);
          break;
        }
      }
      // At this stage the packaged buffer should be ready for writing
      writeFile(packagedBuffer, filename, function() {
        socket.destroy();
      });
    }
  });
  
};

Xmodem.prototype.log = function(data) {
  console.log('modem! : ' + data);
};

module.exports = new Xmodem();

// Utility functions that are not exported
var private_stuff = function() {
  console.log("This is private");
};

/** Internal helper function for scoped intervals */
function setIntervalX(callback, delay, repetitions) {
  var x = 0;
  var intervalID = setInterval(function () {
    if (++x === repetitions) {
      clearInterval(intervalID);
      receive_interval_timer = false;
    }
    callback();
  }, delay);
  return intervalID;
}

function sendBlock(socket, blockNr, blockData, mode) {
  var crcCalc = 0;
  var sendBuffer = Buffer.concat([new Buffer([SOH]),
                                  new Buffer([blockNr]),
                                  new Buffer([(0xFF - blockNr)]),
                                  blockData
                                  ]);
  console.log('SENDBLOCK!');
  console.log(sendBuffer);
  if(mode === 'crc') {
    sendBuffer = Buffer.concat([sendBuffer, new Buffer(crc.crc16ccitt(sendBuffer).toString(16), "hex")]);
  }
  else {
    for(i = 0; i < sendBuffer.length; i++) {
      crcCalc = crcCalc + sendBuffer.readUInt8(i);
    }
    crcCalc = crcCalc % 100;
    sendBuffer = Buffer.concat([sendBuffer, new Buffer(crcCalc.toString(16), "hex")]);
  }
  socket.write(sendBuffer);
}

function receiveBlock(socket, blockNr, blockData, mode, callback) {
  var cmd = blockData[0];
  var block = parseInt(blockData[1]);
  var block_check = parseInt(blockData[2]);
  var current_block;

  if(cmd === SOH) {
    if((block + block_check) === 0xFF) {
      // Are we expecting this block?
      if(block === blockNr) {
        current_block = blockData.slice(3, blockData.length-2);
      }
      else {
        console.log('ERROR: Synch issue! Received: ' + block + ' Expected: ' + blockNr);
        return;
      }
    }
    else {
      console.log('ERROR: Block integrity check failed!');
      socket.write(new Buffer([NAK]));
      return;
    }
    socket.write(new Buffer([ACK]));
    callback(current_block);
  }
  else {
    console.log('ERROR!');
    return;
  }
}

function writeFile(buffer, filename, callback) {
  var fileStream = fs.createWriteStream(filename);
  fileStream.once('open', function(fd) {
    for(i = 0; i < buffer.length; i++) {
      fileStream.write(buffer[i]);
    }
    fileStream.end();
    console.log('File written');
    callback();
  });
}