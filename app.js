'use strict';
var server = require('restify').createServer(),
	mailingQueue = require('./Queue').create(),
	Mailing = require('./Mailing'),
	Constants = require('./Constants'),
	mongoClient = require('mongodb').MongoClient,
	ApiRequestsProvider = require('./ApiRequestsProvider'),
	apiRequestsProvider,
	loopTimerId,
	db;

db = mongoClient.connect(Constants.MONGO_URL, function(err, db) {
	if (err) {
		console.log('Error while connecting to mongo.');
		exit(-1);
	}

	server.get('/send', createDelivery);
	server.listen(8081);

	apiRequestsProvider = ApiRequestsProvider.create(mailingQueue, db);
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

function createDelivery(req, res, next) {
	mailingQueue.append(Mailing.create(req.body));

	//запускаем рассылку сразу, не дожидаясь события таймера, если очередь пуста
	if (apiRequestsProvider.isEmpty()) {
		clearTimeout(loopTimerId);
		loopTimerId = setTimeout(processMailing, Constants.REQUESTS_TIME_LIMIT);
	}
	next();
}

