//  OpenShift sample Node application

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
/*
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))



if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

*/

//WebSocket Server
const http = require('http');
var WebSocketServer = require('websocket').server;
let server = http.createServer(function (req, res) {
		if (url == '/health') {
			res.writeHead(200);
			res.end();
		} else if (url == '/info/gen' || url == '/info/poll') {
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Cache-Control', 'no-cache, no-store');
			res.end(JSON.stringify(sysInfo[url.slice(6)]()));
		}
	});
server.listen(process.env.NODE_PORT || 3000, process.env.NODE_IP || 'localhost', function () {
});

console.log('Server running on http://%s:%s', ip, port);

var wsServer = new WebSocketServer({
		httpServer : server
	});
var count = 0;
var clients = {};
var clientRooms ={};
var roomModes ={};
var roomHost ={};

wsServer.on('request', function (r) {
	console.log(r);
	var connection = r.accept('echo-protocol', r.origin);
	var id = count++;
	clients[id] = connection;
	clientRooms[id]="default";
	var idPassMessage = '{"connectionId":"' + id + '"}';
	clients[id].sendUTF(idPassMessage);
	connection.on('message', function (message) {
		
		var msgString = message.utf8Data;
		console.log(message);
		
		var room = undefined;
		var configMessage=false;
		if(msgString[0]=="*")
		{
			msgString=msgString.slice(1,msgString.length);
			try {
				var JSONVersion=JSON.parse(msgString);
				if(JSONVersion['room']!=undefined)
				{
					clientRooms[id]=JSONVersion['room'];
				}
				if(JSONVersion['roomMode']!=undefined)
				{
					roomModes[clientRooms[id]]=JSONVersion['roomMode'];
				}
				if(JSONVersion['amHost']!=undefined && JSONVersion['amHost']=="true")
				{
					roomHost[clientRooms[id]]=id;
				}
			}catch(err){}
		}
		if(roomModes[clientRooms[id]]=="controller"&&roomHost[clientRooms[id]]!=id)
		{
			clients[roomHost[clientRooms[id]]].sendUTF(msgString);
		}
		else
		{
			for (var i in clients) {
				if (i != id&&clientRooms[i]==clientRooms[id]) {
					clients[i].sendUTF(msgString);
				}
			}
		}
	});

	connection.on('close', function (reasonCode, description) {
		delete clients[id];
	});
});

module.exports = app ;
