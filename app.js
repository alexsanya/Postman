'use strict';
var q = require('q'),
	server = require('restify').createServer(),
	textBody = require('body'),
	Events = require('events'),
	Queue = require('./Queue'),
	Mailing = require('./Mailing'),
	Constants = require('./Constants'),
	vkontakte_api = require('./vkontakte-api'),
	mongoClient = require('mongodb').MongoClient,
	ApiRequestsProvider = require('./ApiRequestsProvider'),
	apiRequestsProvider,
	mailingQueue,
	eventEmitter,
	loopTimerId;

mongoClient.connect(Constants.MONGO_URL, function(err, db) {
	if (err) {
		console.log('Error while connecting to mongo.');
		exit(-1);
	}

	eventEmitter = new Events.EventEmitter();
	mailingQueue = Queue.create(eventEmitter);

	//#TODO Загрузка очереди из базы со статусом != finished

	server.post('/send', function (req, res) {
		textBody(req, function (err, body) {
			var newMailing = createMailing(body);
			res.setHeader('X-Mailing-Id', newMailing._id);
			res.send(201);
		});
	});

	//#TODO Получение статуса рассылки
	server.listen(8081);

	apiRequestsProvider = ApiRequestsProvider.create(mailingQueue, db, eventEmitter);
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
					{vk_id: playerId },
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
		console.log('Processing api request: ', JSON.stringify(apiRequest));
	}

	function createMailing(body) {
		return mailingQueue.append(Mailing.create(body));

		//запускаем рассылку сразу, не дожидаясь события таймера, если очередь пуста
		if (apiRequestsProvider.isEmpty()) {
			clearTimeout(loopTimerId);
			processMailing();
		}
	}
});


