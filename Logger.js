'use strict';

var fs = require('fs');

function Logger(logFile) {
    this.logFile = logFile;
}

Logger.prototype.append = function (line) {
    fs.appendFile(this.logFile, (new Date) + ' ' +line + '\n');
};

Logger.create = function (logFile) {
  return new this(logFile);
};

module.exports = Logger;
