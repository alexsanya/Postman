'use strict';

var q = require('q'),
    fs = require('fs');

module.exports = {
  load: function (fileName) {
    var deferred = q.defer();
    fs.readFile(fileName, function (err, data) {
       if (err) {
           return deferred.reject(err);
       }

       deferred.resolve(JSON.parse(data.toString()));
    });
    return deferred.promise;
  }
};
