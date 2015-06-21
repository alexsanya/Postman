'use strict';

var q = require('q'),
    Constants = require('./Constants'),
    ApiRequest = require('./ApiRequest');

function ApiRequestProvider(mailingQueue, db, eventEmitter) {
    this.mailingQueue = mailingQueue;
    this.eventEmitter = eventEmitter;
    this.db = db;
}

ApiRequestProvider.prototype.isEmpty = function () {
    return this.mailingQueue.head();
}

ApiRequestProvider.prototype.getNextApiRequest = function () {
    var mailing = this.mailingQueue.head(),
        deferred = q.defer(),
        self = this;

    function pullPlayersGroup(mailing) {
        self.eventEmitter.removeAllListeners('append');
        mailing.markStarted();
        self.db.collection('players')   //проверка списка отправленных уведомдений
            .find({
                mailing_list: {
                    $nin: [mailing._id]
                }
            })
            .sort({first_name: 1})
            .limit(Constants.MAX_NOTIFICATIONS_AT_ONCE)
            .toArray(function (err, players) {
                if (!players.length) {
                    self.mailingQueue.eject();
                    return deferred.resolve(self.getNextApiRequest());
                }
                var userName = players[0].first_name,
                    usersWithSameName = players.filter(function (player){
                        return player.first_name === userName;
                    })
                        .map(function (player) {
                            return player.vk_id;
                        });
                deferred.resolve(ApiRequest.create(
                        mailing._id,
                        usersWithSameName,
                        mailing.template.split('%name%').join(userName)
                    )
                );
            });
    }

    if (!mailing) {
        self.eventEmitter.on('append', function () {
            pullPlayersGroup(self.mailingQueue.head());
        });
    } else {
        pullPlayersGroup(mailing);
    }

    return deferred.promise;
}

ApiRequestProvider.create = function (mailingQueue, db, eventEmitter) {
    return new this(mailingQueue, db, eventEmitter);
};

module.exports = ApiRequestProvider;
