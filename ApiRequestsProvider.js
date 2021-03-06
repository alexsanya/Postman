'use strict';

var q = require('q'),
    Constants = require('./Constants'),
    ApiRequest = require('./ApiRequest');

function ApiRequestProvider(mailingQueue, db, eventEmitter, logger) {
    this.mailingQueue = mailingQueue;
    this.eventEmitter = eventEmitter;
    this.logger = logger;
    this.db = db;
}

ApiRequestProvider.prototype.getNextApiRequest = function () {
    var mailing = this.mailingQueue.head(),
        deferred = q.defer(),
        self = this;

    function pullPlayersGroup(mailing) {
        self.eventEmitter.removeAllListeners('append');
        if (mailing.state === 'waiting') {
            mailing.markStarted();
            self.logger.append('[mailing.start] Started mailing ' + mailing._id + ' Template: ' + mailing.template);
            self.db.collection('mailings').updateOne(
                {_id: mailing._id},
                {$set: {state: 'in progress', startedAt: Date.now()}}
            );
        }
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
                    self.logger.append('[mailing.finish] Mailing ' + mailing._id + ' done.');
                    self.db.collection('mailings').updateOne(
                        {_id: mailing._id},
                        {$set: {state: 'done', finishedAt: Date.now()}},
                        function (err) {
                            if (!err) {
                                deferred.resolve(self.getNextApiRequest());
                            }
                        }
                    );
                    return;
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
};

ApiRequestProvider.create = function (mailingQueue, db, eventEmitter, logger) {
    return new this(mailingQueue, db, eventEmitter, logger);
};

module.exports = ApiRequestProvider;
