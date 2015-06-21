'use strict';

function ApiRequest(id, playersList, message) {
    this.id = id;
    this.playersList = playersList;
    this.message = message;
}

ApiRequest.create = function (id, usersList, message) {
    return new this(id, usersList, message);
}

module.exports = ApiRequest;


