'use strict';
var server = require('restify').createServer(),
	textBody = require('body'),
	Events = require('events'),
	Queue = require('./Queue'),
	Mailing = require('./Mailing'),
	Constants = require('./Constants'),
	mongoClient = require('mongodb').MongoClient,
	ApiRequestsProvider = require('./ApiRequestsProvider'),
	apiRequestsProvider,
	mailingQueue,
	eventEmitter,
	loopTimerId,
	db;

db = mongoClient.connect(Constants.MONGO_URL, function(err, db) {
	if (err) {
		console.log('Error while connecting to mongo.');
		exit(-1);
	}

	eventEmitter = new Events.EventEmitter();
	mailingQueue = Queue.create(eventEmitter);

	server.post('/send', function (req, res) {
		textBody(req, createMailing);
	});
	server.listen(8081);

	apiRequestsProvider = ApiRequestsProvider.create(mailingQueue, db, eventEmitter);
	loopTimerId = setTimeout(processMailing, Constants.REQUESTS_TIME_LIMIT);
});

function processMailing() {
	apiRequestsProvider.getNextApiRequest()
		.then(processApiRequest)
		.then(logApiRequest)
		.then(setTimeout.bind(null, processMailing, Constants.REQUESTS_TIME_LIMIT));
}

function processApiRequest(apiRequest) {
	console.log('Processing api request: ', JSON.stringify(apiRequest));
	return apiRequest;
}

function logApiRequest() {
	console.log('Logging');
}

function createMailing(err, body) {
	mailingQueue.append(Mailing.create(body));

	//запускаем рассылку сразу, не дожидаясь события таймера, если очередь пуста
	if (apiRequestsProvider.isEmpty()) {
		clearTimeout(loopTimerId);
		loopTimerId = setTimeout(processMailing, Constants.REQUESTS_TIME_LIMIT);
	}
	next();
}

