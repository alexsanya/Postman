'use strict';

function ApiRequest(usersList, message) {
    this.usersList = usersList;
    this.message = message;
}

ApiRequest.create = function (usersList, message) {
    return new this(usersList, message);
}

module.exports = ApiRequest;


