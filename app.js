// Include the cluster module
var cluster = require('cluster');
// Code to run if we're in the master process
if (cluster.isMaster) {
    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;
    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }
    // Listen for terminating workers
    cluster.on('exit', function (worker) {
        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });
// Code to run if we're in a worker process
} else {
    var AWS = require('aws-sdk');
    var express = require('express');
    var bodyParser = require('body-parser');

    AWS.config.region = process.env.REGION

    //var sns = new AWS.SNS();
    var ddb = new AWS.DynamoDB();

    var ddbTable =  process.env.YOU_TUBE_QUEUE_TABLE;
    //var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
    var app = express();

    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(bodyParser.urlencoded({extended:false}));

    app.get('/', function(req, res) {
        res.render('index', {
            static_path: 'static',
            theme: process.env.THEME || 'flatly',
            flask_debug: process.env.FLASK_DEBUG || 'false'
        });
    });

    app.post('/addlink', function(req, res) {
        var item = {
            'link': {'S': req.body.link},
        };

        ddb.putItem({
            'TableName': ddbTable,
            'Item': item,
            'Expected': { link: { Exists: false } }
        }, function(err, data) {
            if (err) {
                var returnStatus = 500;

                if (err.code === 'ConditionalCheckFailedException') {
                    returnStatus = 409;
                }

                res.status(returnStatus).end();
                console.log('DDB Error: ' + err);
            } else {
							/*
                sns.publish({
                    'Message': 'Name: ' + req.body.name + "\r\nEmail: " + req.body.email
                                        + "\r\nPreviewAccess: " + req.body.previewAccess
                                        + "\r\nTheme: " + req.body.theme,
                    'Subject': 'New user sign up!!!',
                    'TopicArn': snsTopic
                }, function(err, data) {
                    if (err) {
                        res.status(500).end();
                        console.log('SNS Error: ' + err);
                    } else {
                        res.status(201).end();
                    }
                });
								*/
            }
        });
    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}

function sendAlert(text) {
	alert(text);
}

function saveText() {
  var textboxText = document.getElementById("textbox").value;
  sendAlert(textboxText);
}

function onYouTubePlayerAPIReady() {
  var player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '0Bmhjf0rKe8',
    events: {
    'onReady': onPlayerReady,
    'onStateChange': onPlayerStateChange
    }
  });
}

// autoplay video
function onPlayerReady(event) {
   event.target.playVideo();
}

// when video ends
function onPlayerStateChange(event) {
   if(event.data === 0) {
       alert('done');
   }
}
