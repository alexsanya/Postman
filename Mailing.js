'use strict';

function Mailing(template) {
    this.createdAt = Date.now();
    this._id = this.createdAt;
    this.state = 'waiting';
    this.template = template;
}

Mailing.create = function (template) {
  return new this(template);
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