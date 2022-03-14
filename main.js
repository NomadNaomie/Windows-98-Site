const fs = require("fs");
const express = require("express");
const app = express();
const WebSocket = require('ws');
const Twitter = require('twitter');
const http = require("https");
const twitterAuth = require("./twitterAuth.json");
const sqlite = require("better-sqlite3");
nouns = require('./nouns.json');
adjectives = require('./adjectives.json');
adverbs = require('./adverbs.json');
vowels = ['a','e','i','o','u'];
// const http = require("http");
//Create connections table if it doesn't exist
const db = new sqlite("./connections.db");
db.prepare("CREATE TABLE IF NOT EXISTS connections (ip TEXT, page TEXT, time INTEGER)").run();
db.prepare('CREATE TABLE IF NOT EXISTS messages (message TEXT)').run();

const path = require("path");
app.use(express.static(__dirname + "/public"));
app.get('/favicon.ico', express.static('favicon.ico'));

app.get('/', function(req, res) {
    try{
        db.prepare("INSERT INTO connections VALUES (?, ?, ?)").run(req.ip, req.path, Date.now());
    }
    catch(err){
        console.log(err);
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/hankgreenbooks', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/hankgreen.html'));
});

app.get('/parler', function(req, res) {
    try{
        db.prepare("INSERT INTO connections VALUES (?, ?, ?)").run( req.ip, req.path, Date.now());
    }
    catch(err){
        console.log(err);
    }
    res.sendFile(path.join(__dirname, 'public/parlerVideoData.html'));
});
app.get('/map', function(req, res) {
    try{
        db.prepare("INSERT INTO connections VALUES (?, ?, ?)").run( req.ip, req.path, Date.now());
    }
    catch(err){
        console.log(err);
    }
    res.sendFile(path.join(__dirname, 'public/map.html'));
});
app.get('/hearth', function(req, res) {
    try{
        db.prepare("INSERT INTO connections VALUES (?, ?, ?)").run( req.ip, req.path, Date.now());
    }
    catch(err){
        console.log(err);
    }
    res.sendFile(path.join(__dirname, 'public/hearth.html'));
});
app.get('/valo',function(req,res){
    try{
        db.prepare("INSERT INTO connections VALUES (?, ?, ?)").run( req.ip, req.path, Date.now());
    }
    catch(err){
        console.log(err);
    }
    res.sendFile(path.join(__dirname, 'public/valo.html'));
});
app.get('/members', function(req, res) {
    try{
        db.prepare("INSERT INTO connections VALUES (?, ?, ?)").run( req.ip, req.path, Date.now());
    }
    catch(err){
        console.log(err);
    }
    res.sendFile(path.join(__dirname, 'public/members.html'));
});


function generateTitle(){
    adv = adverbs[Math.floor(Math.random() * adverbs.length)];
    adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    adj = adj.charAt(0).toUpperCase() + adj.slice(1);
    noun = nouns[Math.floor(Math.random() * nouns.length)];
    noun = noun.charAt(0).toUpperCase() + noun.slice(1);
    art = vowels.includes(adv.toLowerCase().charAt(0)) ? "An" : "A";
    art = adv.toLowerCase().charAt(0) == "h" && vowels.includes(adv.toLowerCase().charAt(1)) ? "An" : art;
    return art + " " + adv + " " + adj + " " + noun;
}



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
        data=JSON.parse(message);
        if(data.type=="title"){
            newTitle = generateTitle();
            ws.send(JSON.stringify({type:"title",title:newTitle}));
        }else if (data.type=="anonymousMessage"){
            db.prepare("INSERT INTO messages VALUES (?)").run(data.message);
        }
    });
    client.get('statuses/user_timeline', params, function (error, tweets, response) {
        if (!error) {
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
