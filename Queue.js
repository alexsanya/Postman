'use strict';

function Queue(eventEmitter) {
    this.queue = [];
    this.eventEmitter = eventEmitter;
}

Queue.create = function (eventEmitter) {
    return new this(eventEmitter);
};

Queue.prototype.append = function (item) {
    this.queue.push(item);
    this.eventEmitter.emit('append');
};

Queue.prototype.eject = function () {
    this.eventEmitter.emit('eject');
    return this.queue.length ? this.queue.splice(0, 1)[0] : null;
};

Queue.prototype.head = function () {
    return this.queue.length ? this.queue[0] : null;
};

module.exports = Queue;


