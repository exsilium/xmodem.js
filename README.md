[![Build Status](https://travis-ci.org/exsilium/xmodem.js.svg?branch=master)](https://travis-ci.org/exsilium/xmodem.js) [![Known Vulnerabilities](https://snyk.io//test/github/exsilium/xmodem.js/badge.svg?targetFile=package.json)](https://snyk.io//test/github/exsilium/xmodem.js?targetFile=package.json) [![Coverage Status](https://coveralls.io/repos/github/exsilium/xmodem.js/badge.svg)](https://coveralls.io/github/exsilium/xmodem.js)

# xmodem.js

XMODEM is a simple file transfer protocol. This project implements the protocol in JavaScript. Please see the [API docs](https://exsilium.github.io/xmodem.js/) for more details.

# Installation

`npm install xmodem.js`

# Usage

## Sending

```
var xmodem = require('xmodem.js');
xmodem.send(socket, buffer);
```

## Receiving

```
var xmodem = require('xmodem.js');
xmodem.receive(socket, receiveFile);
```