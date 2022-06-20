const os = require("os");
const { stringify } = require("querystring");
module.exports = class AdminHandler {
    constructor() {
        this.auth = require("./auth.json")
        this.connections = []
        this.freeMem = 0
        this.cpuUsage = Array(os.cpus().length);
    }
    cycle(){
        this.freeMem = Math.round(100*os.freemem() / os.totalmem());
        let cpus = os.cpus();
        for(let i = 0; i < cpus.length; i++) {
            let cpu = cpus[i]
            let totalCpuUsage = 0
            for(let type in cpu.times){totalCpuUsage += cpu.times[type];}
            this.cpuUsage[i] = 100 - Math.round(100*cpu.times["idle"] / totalCpuUsage)
        }

    }
    uploadPass(pass){
        if (!(pass in this.auth.uploadpass)){return false;}
        else if (this.auth.uploadpass.pass.expire < 1){return false;}
        else {return true}
    }
    addPass(pass,expiry){
        this.auth.uploadpass[pass] = {"expiry":expiry};
        //TODO File Writeback?
    }
    recordVisit(req){
        this.connections.push({
            "user-agent":req.headers['user-agent'],
            "path":req.path,
            "queries":JSON.stringify(req.query),
            "date":Date.now()
        })
    }
    isAdmin(pass){
        return this.auth.adminPass == pass;
    }
    handleWS(ws,data){
        if (!this.isAdmin(data.pass)){
            return;
        }
        if (data.type=="status"){
            setInterval(() => {
                ws.send(JSON.stringify({
                    type:"serverHealth",
                    ram:this.freeMem,
                    cpu:this.cpuUsage
                }))
            }, 2000);
        }
    }
}