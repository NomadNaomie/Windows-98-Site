const fs = require("fs");
const express = require("express");
const app = express();
const WebSocket = require('ws');
const Twitter = require('twitter');
const http = require("https");
const twitterAuth = require("./twitterAuth.json");
const gm = require("./GeoguessrMaster.js");
let GeoguessrMaster = new gm();
const AdminHandler = require("./admin.js")
let admin = new AdminHandler();
const multer  = require('multer')
const auth = require("./auth.json")
const sqlite = require("better-sqlite3");
nouns = require('./nouns.json');
adjectives = require('./adjectives.json');
adverbs = require('./adverbs.json');

var uploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        var dir = './uploads';
        if (req.body.uploadpass != auth.uploadpass) {
            cb("Wrong password", null);
            return;
        }
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
        
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({storage: uploadStorage}).any();

vowels = ['a','e','i','o','u'];
// const http = require("http");
//Create connections table if it doesn't exist
// const db = new sqlite("./connections.db");
// db.prepare("CREATE TABLE IF NOT EXISTS connections (page TEXT, time INTEGER)").run();
// db.prepare('CREATE TABLE IF NOT EXISTS messages (message TEXT)').run();


const path = require("path");
app.get('/favicon.ico', express.static('favicon.ico'));

app.use(function recordConnection(req, res, next) {
    admin.recordVisit(req)
    next();
});
app.use(express.static(__dirname + "/public"));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/secret-tone-indicator-roadmap', function(req, res) {
    res.redirect("https://i.imgur.com/IhTpFJz.png")
});
app.get('/hankgreenbooks', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/hankgreen.html'));
});
app.get("/geoguessr", function(req, res) {
    res.sendFile(path.join(__dirname, 'public/streetview.html'));
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
app.get('/valo',function(req,res){

    res.sendFile(path.join(__dirname, 'public/valo.html'));
});
app.get('/members', function(req, res) {

    res.sendFile(path.join(__dirname, 'public/members.html'));
});
app.get("/findingvee", function(req,res){

    res.sendFile(path.join(__dirname, 'public/beta.html'));
});
app.get("/admin",function(req,res){
    if (!req.query.hasOwnProperty("pass")){res.sendStatus(403)}
    admin.isAdmin(req.query.pass) ? res.sendFile(path.join(__dirname,"admin.html")) : res.sendStatus(403)
});

app.get("/game",function(req,res){
    res.sendFile(path.join(__dirname, 'public/game.html'));
});
app.get("/attribution",function(req,res){
    res.sendFile(path.join(__dirname, 'public/attribution.html'));
});
app.get('/fnaf', function(req, res) {

    res.sendFile(path.join(__dirname, 'public/fnaf.html'));
});
app.get('/pokenoms', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/pokenoms.html'));
});
app.get("/upload", function(req, res) {
    res.sendFile(path.join(__dirname, 'public/upload.html'));
});

app.post('/upload', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            return res.send(err);
        }
        res.end("Upload completed.");
    });
})

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
    GeoguessrMaster.proc(ws);
    ws.on('message', function incoming(message) {
        data=JSON.parse(message);
        if (data.hasOwnProperty("admin")){
            admin.handleWS(ws,data);
        }
        if(data.type=="title"){
            newTitle = generateTitle();
            ws.send(JSON.stringify({type:"title",title:newTitle}));
        }else if (data.type=="anonymousMessage"){
            // db.prepare("INSERT INTO messages VALUES (?)").run(data.message);
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

setInterval(()=>{
    admin.cycle()
},1000);
server.listen(443);
