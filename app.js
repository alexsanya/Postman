'use strict';
var q = require('q'),
	server = require('restify').createServer(),
	textBody = require('body'),
	Events = require('events'),
	Queue = require('./Queue'),
	Mailing = require('./Mailing'),
	Logger = require('./Logger'),
	Constants = require('./Constants'),
	Configuration = require('./Configuration'),
	vkontakte_api = require('./vkontakte-api'),
	mongoClient = require('mongodb').MongoClient,
	ApiRequestsProvider = require('./ApiRequestsProvider'),
	apiRequestsProvider,
	mailingQueue,
	eventEmitter,
	loopTimerId,
	logger;

if (process.argv.length < 4) {
	console.info('Usage: node app.js config.json log.txt');
	process.exit(1);
}

Configuration.load(process.argv[2]).then(function (config) {
	if (!config.database || !config.database.url) {
		console.error('Wrong config file format');
		process.exit(1);
	}
	mongoClient.connect(config.database.url, main);
})
	.catch(function (){
		console.info('Error while reading config file');
		process.exit(1);
	});

function main(err, db) {
	if (err) {
		console.error('Mongo connection error.');
		process.exit(1);
	}

	eventEmitter = new Events.EventEmitter();
	mailingQueue = Queue.create(eventEmitter);
	logger = Logger.create(process.argv[3]);

	//#TODO Загрузка очереди из базы со статусом != finished

	server.post('/send', function (req, res) {
		textBody(req, function (err, body) {
			createMailing(body).then(function (newMailing) {
				res.setHeader('X-Mailing-Id', newMailing._id); //идентификатор для запроса статуса
				res.send(201);
			});
		});
	});

	//#TODO Получение статуса рассылки
	server.listen(Constants.PORT);

	apiRequestsProvider = ApiRequestsProvider.create(mailingQueue, db, eventEmitter, logger);
	loopTimerId = setTimeout(processMailing, Constants.REQUESTS_TIME_LIMIT);

	function processMailing() {
		apiRequestsProvider.getNextApiRequest()
			.then(processApiRequest)
			.then(logApiRequest)
			.then(setTimeout.bind(null, processMailing, Constants.REQUESTS_TIME_LIMIT));
	}

	function processApiRequest(apiRequest) {
		var deferred = q.defer(),
			updates = [];
		vkontakte_api.sendNotifications(apiRequest.playersList.join(','), apiRequest.message, function (err) {
			apiRequest.playersList.forEach(function (playerId) {
				var update = q.defer();
				updates.push(update);
				db.collection('players').updateOne(
					{ vk_id: playerId },
					{
						$push: {
							mailing_list: apiRequest.id
						}
					},
					function (err, result) {
						if (!err) {
							update.resolve();
						}
					}
				)
			});
			q.all(updates).then(function () {
				deferred.resolve(apiRequest);
			});
		});
		return deferred.promise;
	}

	function logApiRequest(apiRequest) {
		logger.append(
			'[api.request] ' +
			'Mailing id: ' + mailingQueue.head()._id + ' ' +
			'Players: ' + JSON.stringify(apiRequest.playersList)
		);
	}

	function createMailing(body) {
		var deferred = q.defer(),
			mailing =  mailingQueue.append(Mailing.create(body));
		db.collection('mailings').insertOne(mailing, function (err) {
			if (!err) {
				logger.append(
					'[mailing.create] ' +
					'Mailing id: ' + mailing._id
				);
				deferred.resolve(mailing);
			} else {
				deferred.reject(err);
			}
		});

		return deferred.promise;
	}
}


