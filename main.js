const fs = require("fs");
const express = require("express");
const app = express();
const WebSocket = require('ws');
const Twitter = require('twitter');
const http = require("https");
const twitterAuth = require("./twitterAuth.json");
// const http = require("http");


const path = require("path");
app.use(express.static(__dirname + "/public"));
app.get('/favicon.ico', express.static('favicon.ico'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/parler', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/parlerVideoData.html'));
});
app.get('/map', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/map.html'));
});
app.get('/hearth', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/hearth.html'));
});
app.get('/members', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/members.html'));
});

var client = new Twitter({
    consumer_key: twitterAuth.consumer_key,
    consumer_secret: twitterAuth.consumer_secret,
    access_token_key: twitterAuth.access_token_key,
    access_token_secret: twitterAuth.access_token_secret
});
var params = { screen_name: 'nomadnaomie' };

const cert = fs.readFileSync('./nao.pem');
const key = fs.readFileSync('./nao.key');
const options={cert:cert,key:key};
// const server = http.createServer(app);
const server = http.createServer(options,app)
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    client.get('statuses/user_timeline', params, function (error, tweets, response) {
        if (!error) {
            //pfp author body link
            var sendTweets = []
            for (tweet of tweets) {
                sendTweets.push({
                    "pfp": tweet['user']['profile_image_url'],
                    "author": "@" + tweet['user']['name'],
                    "body": tweet['text'],
                    "link": `https://twitter.com/${tweet['user']['name']}/status/${tweet['id_str']}`
                })
            }
            ws.send(JSON.stringify(sendTweets));
        }
    });
});


server.listen(443);