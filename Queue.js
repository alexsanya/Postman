'use strict';

function Queue() {
    this.queue = [];
}

Queue.create = function () {
    return new this;
};

Queue.prototype.append = function (item) {
    this.queue.push(item);
};

Queue.prototype.eject = function () {
    return this.queue.length ? this.queue.splice(0, 1)[0] : null;
};

Queue.prototype.head = function () {
    return this.queue.length ? this.queue[0] : null;
};

module.exports = Queue;


