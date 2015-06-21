'use strict';

function Mailing(template, id) {
    this.createdAt = id ? id : Date.now();
    this._id = this.createdAt;
    this.state = 'waiting';
    this.template = template;
}

Mailing.create = function (template, id) {
  return new this(template, id);
};

Mailing.prototype.markStarted = function () {
    this.state = 'in progress';
    this.startedAt = Date.now();
};

Mailing.prototype.markDone = function () {
    this.state = 'done';
    this.finishedAt = Date.now();
};

module.exports = Mailing;