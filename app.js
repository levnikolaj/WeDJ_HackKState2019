// Include the cluster module
var cluster = require('cluster');
var fs = require('fs');
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

    var pre_embed_str = '<iframe width="560" height="315" src="https://www.youtube.com/embed/'
    var post_embe_str = 'controls=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'

    AWS.config.region = process.env.REGION

    var sns = new AWS.SNS();
    var ddb = new AWS.DynamoDB();

    var ddbTable =  process.env.STARTUP_SIGNUP_TABLE;
    var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
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

    app.post('/signup', function(req, res) {
        var item = {
            'email': {'S': req.body.email},
            'name': {'S': req.body.name},
            'preview': {'S': req.body.previewAccess},
            'theme': {'S': req.body.theme}
        };

        ddb.putItem({
            'TableName': ddbTable,
            'Item': item,
            'Expected': { email: { Exists: false } }
        }, function(err, data) {
            if (err) {
                var returnStatus = 500;

                if (err.code === 'ConditionalCheckFailedException') {
                    returnStatus = 409;
                }

                res.status(returnStatus).end();
                console.log('DDB Error: ' + err);
            } else {
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
            }
        });
    });

    app.post('/addlink', function(req,res) {
      var item = {
         'link': {'S': req.body.search}
      };

      ddb.putItem( {
        'TableName': ddbTable,
        'Item': item,
        'Expected': { link: {Exists: false} }
      }, function(err, data) {
          if(err) {
            var returnStatus = 500;

            if(err.code === 'ConditionalCheckFailedException') {
              returnStatus = 409;
            }

            res.status(returnStatus).end();
            console.log('DDB Error: ' + err);
          } else {
            console.log('Passed DB call');
            res.status(201).end();
          }
      });
      /*
      var fullLink = req.body.search;
      var videoID = fullLink.split('=')[1];
      var str = pre_embed_str + videoID  + post_embe_str;

      var obj = document.getElementById('replacement');
      if(obj.outerHTML) {
        obj.outerHTML = str;
      }
      else {
        console.log("You are out of luck");
        var tmpObj = document.createElement("div");
        tmpObj.innerHTML=pre_embed_str + videoID  + post_embe_str;
        ObjParent = Obj.parentNode;
        ObjParent.replaceChild(tmpObj, obj);
        ObjParent.innerHTML = ObjParent.innerHTML.replace('<div id="replacement">%1</div>', str);
      }*/
    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
