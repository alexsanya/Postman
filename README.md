## Тестовое задание
Данный скрипт является решением тестового задания
## Запуск
node app.js config.json log.txt

Файл config.json содержит данные для подключения к монге. В файл log.txt пишутся логи.
После запуска со скриптом можно взаимодействовать посредством http-запросов.
Запрос для создание новой рассылки:
```
POST /send
Hello, %name% this is notification for you!
```
Ответ:
```
X-Mailing-Id: 1434925739277
201 Created
```
В заголовке X-Mailing-Id содержится идентификатор созданной рассылки. Новая рассылка либо сразу начинает выполняться, либо помещается в очередь. Состояние рассылки можно узнать посредством GET-запроса.
Запрос состояния рассылки:
```
GET status/1434925739277
```
Ответ:
```json
{
"_id": 1434925739277,
"createdAt": 1434925739277,
"finishedAt": 1434925780662,
"startedAt": 1434925739278,
"state": "done",
"template": "Hello, %name% this is notification for you!"
}
```
К недостаткам моего решения можно оснести создание дополнительного поля в коллекции players, однако к это позволяет налету подхватывать все обновления базы.
Логирование ведется в файл, а так-же в коллекцию mailings,благодаря которой скрипт полностью восстанавливает очередь рассылок после перезагрузки.
##Формат логирования
```
Mon Jun 22 2015 01:19:50 GMT+0300 (MSK) Mailing service started
Mon Jun 22 2015 01:19:50 GMT+0300 (MSK) Checking for unfinished mailings...
Mon Jun 22 2015 01:20:07 GMT+0300 (MSK) [mailing.start] Started mailing 1434925207646 Template: Hello %name% And again %name% hello!
Mon Jun 22 2015 01:20:07 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [100,0]
Mon Jun 22 2015 01:20:07 GMT+0300 (MSK) [mailing.create] Mailing id: 1434925207646
Mon Jun 22 2015 01:20:08 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [1,101]
Mon Jun 22 2015 01:20:08 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [10]
Mon Jun 22 2015 01:20:09 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [11]
Mon Jun 22 2015 01:20:09 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [12]
Mon Jun 22 2015 01:20:09 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [13]
Mon Jun 22 2015 01:20:10 GMT+0300 (MSK) [mailing.create] Mailing id: 1434925210288
Mon Jun 22 2015 01:20:10 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [14]
Mon Jun 22 2015 01:20:10 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [15]
Mon Jun 22 2015 01:20:11 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [16]
Mon Jun 22 2015 01:20:11 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [17]
Mon Jun 22 2015 01:20:12 GMT+0300 (MSK) [api.request] Mailing id: 1434925207646 Players: [18]
```

##Тестовые данные
Для заполнения базы тестовыми данными я использовал этот скрипт:
```js
for (var i=0; i < 100; i++) {
	db.players.insert({vk_id: i, first_name: 'User '+i})
}
for (var i=0; i < 10; i++) {
	db.players.insert({vk_id: i+100, first_name: 'User '+i})
}
```
К скрипту прилагаюься тесты в папке spec
