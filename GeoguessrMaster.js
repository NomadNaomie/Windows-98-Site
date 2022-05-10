module.exports = class GeoguessrMaster {
    constructor() {
        this.clients = {};
        this.panos = require("./panos.json");
        this.panoOptions = {};
        this.games = {};

    }
    colorGradient(fadeFraction, rgbColor1, rgbColor2) {
        var color1 = rgbColor1;
        var color2 = rgbColor2;
        var fade = fadeFraction;


        var diffRed = color2.red - color1.red;
        var diffGreen = color2.green - color1.green;
        var diffBlue = color2.blue - color1.blue;

        var gradient = {
            red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
            green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
            blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
        };

        return 'rgba(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ',0.7)';
    }
    distance(x1, x2, z1, z2) {
        return Math.abs(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(z1 - z2, 2)));
    }
    score(x) {
        x + 1;
        let score = -2 * (x / 4) + 105;
        score > 100 ? score = 100 : score < 0 ? score = 0 : score = score;
        return Math.round(score);

    }
    proc(wsc) {
        let ws = wsc;
        ws.lastTime = new Date().getTime();
        ws.clientID = ws._socket.remoteAddress;
        ws.on("message", (data) => {
            ws.lastTime = new Date().getTime();
            data = JSON.parse(data);
            this.clients[ws.clientID] = ws;
            ws.acceptable = { 6: false, 7: true };
            this.clients[ws.clientID] = ws;
            if (data.type == "hcgeo") {
                if (this.games.hasOwnProperty(ws.clientID)) {
                    this.games[ws.clientID] += 1;
                } else {
                    this.games[ws.clientID] = 1;
                }
                if (this.panoOptions.hasOwnProperty(ws.clientID)) {
                    if (this.panoOptions[ws.clientID].length < 5) {
                        if (ws.acceptable[6] && ws.acceptable[7]) {
                            this.panoOptions[ws.clientID] = Object.keys(this.panos);
                        } else if (ws.acceptable[6] && !ws.acceptable[7]) {
                            this.panoOptions[ws.clientID] = Object.keys(this.panos).filter(e => this.panos[e].season === 6);
                        } else if (ws.acceptable[7] && !ws.acceptable[6]) {
                            this.panoOptions[ws.clientID] = Object.keys(this.panos).filter(e => this.panos[e].season === 7);
                        } else {
                            this.panoOptions[ws.clientID] = Object.keys(this.panos);
                        }
                    }
                } else {
                    if (ws.acceptable[6] && ws.acceptable[7]) {
                        this.panoOptions[ws.clientID] = Object.keys(this.panos);
                    } else if (ws.acceptable[6] && !ws.acceptable[7]) {
                        this.panoOptions[ws.clientID] = Object.keys(this.panos).filter(e => this.panos[e].season === 6);
                    } else if (ws.acceptable[7] && !ws.acceptable[6]) {
                        this.panoOptions[ws.clientID] = Object.keys(this.panos).filter(e => this.panos[e].season === 7);
                    } else {
                        this.panoOptions[ws.clientID] = Object.keys(this.panos);
                    }
                }
                ws.game = { "start": new Date().getTime().toLocaleString(), "acceptable": [ws.acceptable], "panos": [], "score": 0 }
                ws.game.total = 0;
                ws.send(JSON.stringify({ "type": "acceptable", "acceptable": JSON.stringify(ws.acceptable) }));
                setTimeout(() => {
                    let idx = 0;
                    let sN = 0;
                    idx = Math.floor(Math.random() * this.panoOptions[ws.clientID].length);
                    sN = this.panos[this.panoOptions[ws.clientID][idx]].season;
                    let pan = this.panoOptions[ws.clientID][idx];
                    let ans = this.panos[pan];
                    this.panoOptions[ws.clientID] = this.panoOptions[ws.clientID].filter(e => e !== this.panoOptions[ws.clientID][idx])
                    ws.game.total += 1;
                    ws.send(JSON.stringify({
                        "ans": ans,
                        "type": "panorama",
                        "panorama": pan
                    }));
                    ws.game.panos.push({ "panorama": pan, "season": sN, "ans": ans });
                }, 1000);
            }
            if (data.type == "seasonChange") {
                ws.acceptable[data.season] = !ws.acceptable[data.season];
                if (ws.acceptable[6] && ws.acceptable[7]) {
                    this.panoOptions[ws.clientID] = Object.keys(this.panos);
                } else if (ws.acceptable[6] && !ws.acceptable[7]) {
                    this.panoOptions[ws.clientID] = Object.keys(this.panos).filter(e => this.panos[e].season === 6);
                } else if (ws.acceptable[7] && !ws.acceptable[6]) {
                    this.panoOptions[ws.clientID] = Object.keys(this.panos).filter(e => this.panos[e].season === 7);
                } else {
                    this.panoOptions[ws.clientID] = Object.keys(this.panos);
                }
                ws.game.acceptable.push(ws.acceptable);
            }
            if (data.type == "choice") {

                let dist = this.distance(data.choice.x, this.panos[data.panorama].x, data.choice.z, this.panos[data.panorama].z);
                let scr = this.score(dist);
                ws.game.score += scr;
                ws.game.total += 1;
                ws.game.panos.push({ "panorama": data.panorama, "score": scr, "distance": dist })
                let distColor = this.colorGradient(scr / 100, { red: 255, green: 0, blue: 0 }, { red: 0, green: 255, blue: 0 })

                ws.send(JSON.stringify({
                    "type": "guessAnswer",
                    "distance": Math.round(dist),
                    "score": scr,
                    "distanceColour": distColor
                }));
                if (ws.game.total < 6) {
                    setTimeout(() => {
                        try {
                            let idx = Math.floor(Math.random() * this.panoOptions[ws.clientID].length);
                            let pan = this.panoOptions[ws.clientID][idx];
                            let ans = this.panos[pan];
                            this.panoOptions[ws.clientID] = this.panoOptions[ws.clientID].filter(e => e !== this.panoOptions[ws.clientID][idx])
                            ws.send(JSON.stringify({
                                "ans": ans,
                                "type": "panorama",
                                "panorama": pan,
                            }));
                        }
                        catch (e) {
                            ws.terminate();
                        }
                    }, 1000);
                } else {
                    ws.send(JSON.stringify({
                        "type": "gameOver",
                    }));
                }

            }

        });
    }
}