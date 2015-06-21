'use strict';

var q = require('q'),
    Constants = require('./Constants'),
    ApiRequest = require('./ApiRequest');

function ApiRequestProvider(mailingQueue, db) {
    this.mailingQueue = mailingQueue;
    this.db = db;
}

ApiRequestProvider.prototype.getNextApiRequest = function () {
    var mailing = this.mailingQueue.head(),
        deferred = q.defer(),
        self = this;
    if (!mailing) {
        return q.resolve();
    }
    mailing.markStarted();
    self.db.collection('palyers')
        .find({
            mailing_list: {
                $not: {
                    $elemMatch: mailing._id
                }
            }
        })
        .sort({first_name: 1})
        .limit(Constants.MAX_NOTIFICATIONS_AT_ONCE)
        .toArray(function (err, users) {
            if (!users.length) {
                self.mailingQueue.eject();
                return deferred.resolve(self.getNextApiRequest());
            }
            var userName = users[0].first_name,
                usersWithSameName = users.filter(function (){
                    return user.first_name === userName;
                });
            deferred.resolve(ApiRequest.create(
                usersWithSameName,
                mailing.template.replace('%name%', userName))
            );
        });
    return deferred.promise;
}

ApiRequestProvider.create = function (mailingQueue, db) {
    return new this(mailingQueue, db);
};

module.exports = ApiRequestProvider;
