'use strict';

var chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    Queue = require('../Queue'),
    Mailing = require('../Mailing'),
    ApiRequestsProvider = require('../ApiRequestsProvider');


var should = chai.should();

chai.use(sinonChai);

describe('Queue', function () {
    var queue,
        mockEventEmitter;

    beforeEach(function () {
        mockEventEmitter = {
          emit: sinon.spy()
        };
        queue = Queue.create(mockEventEmitter);
    });

    describe('Eject', function () {

        it('Should return null on empty queue', function () {
            should.not.exist(queue.eject());
        });

        it('Should return first appended item', function () {
            queue.append(123);
            queue.eject().should.equal(123);
        });

        it('Should return items in correct order', function () {
            queue.append(1);
            queue.append(2);
            queue.append(3);
            queue.eject().should.equal(1);
            queue.eject().should.equal(2);
            queue.eject().should.equal(3);
            should.not.exist(queue.eject());
        });

        it('Should return items in correct order while mix operations', function () {
            queue.append(1);
            queue.append(2);
            queue.append(3);
            queue.eject().should.equal(1);
            queue.append(4);
            queue.eject().should.equal(2);
            queue.append(5);
            queue.eject().should.equal(3);
            queue.eject().should.equal(4);
            queue.eject().should.equal(5);
            should.not.exist(queue.eject());
        });
    });

    describe('Head', function () {

        it('Should return null on empty queue', function () {
            should.not.exist(queue.head());
        });

        it('Should return first appended item', function () {
            queue.append(123);
            queue.head().should.equal(123);
        });

        it('Should not remove items', function () {
            queue.append(1);
            queue.append(2);
            queue.append(3);
            queue.head().should.equal(1);
            queue.head().should.equal(1);
        });

        it('Should return items in correct order while mix operations', function () {
            queue.append(1);
            queue.append(2);
            queue.append(3);
            queue.head().should.equal(1);
            queue.append(4);
            queue.eject();
            queue.append(5);
            queue.head().should.equal(2);
            queue.eject();
            queue.head().should.equal(3);
        });
    });
});

describe('Mailing', function () {
    var mailing;

    beforeEach(function () {
        mailing = Mailing.create('abc');
    });

    it('should create with status "waiting"', function () {
        mailing.state.should.equal('waiting');
    });

    it('should store timestamp', function () {
        should.exist(mailing.createdAt);
    });

    it('should store template', function () {
        should.exist(mailing.template);
        mailing.template.should.equal('abc');
    });

    it('should marked started', function () {
        mailing.markStarted();
        should.exist(mailing.startedAt);
        mailing.state.should.equal('in progress');
    });

    it('should marked done', function () {
        mailing.markDone();
        should.exist(mailing.finishedAt);
        mailing.state.should.equal('done');
    });
});
