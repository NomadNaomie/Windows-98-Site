class Map {
    constructor(config) {
        this.entities = config.entities;
        this.lowerMap = new Image();
        this.world = null;
        this.jumpPoints = config.jumpPoints || {};
        this.walls = config.walls || {};
        this.poi = config.poi || {};
        this.lowerMap.src = config.lowerMapSrc;
        this.lowerMap.onload = () => {
            this.lowerMapReady = true;
        }
        this.upperMap = new Image();
        this.upperMap.src = config.upperMapSrc;
        this.upperMap.onload = () => {
            this.upperMapReady = true;
        }
        this.dead = false;
        this.ready = true;
        this.interacting = false;
        this.last;
    }
    drawLower(context, camera) {
        this.lowerMapReady && context.drawImage(this.lowerMap, utils.withGrid(6.5)  - camera.x, utils.withGrid(5) - camera.y);
    }
    drawUpper(context, camera) {
        this.upperMapReady && context.drawImage(this.upperMap, -16000, 0);
    }
    loadEntities() {
        this.dead = false;
        Object.keys(this.entities).forEach(key => {
            this.entities[key].id = key;
            this.entities[key].load(this);

        });
    }
    isSpaceTaken(currentX, currentY, direction) {
        
        let {x,y} = utils.nextPosition(currentX, currentY, direction);
        // check 15 pixels in every direction
        x = x - x % 16;
        y = y - y % 16;
        return this.walls[`${x},${y}`] || false;
    }
    async cutscene(agenda){
        this.ready = false;
        for (let i = 0; i < agenda.length; i++) {
            let event = agenda[i];
            if (event.type == "look"){
                if (event.direction == ""){
                    let protag = this.entities['protag'];
                    let entity = this.entities[event.id];
                    if(entity.x == protag.x && entity.y < protag.y){
                        event.direction = "down";
                        this.last = entity.direction;
                    }
                    if(entity.x == protag.x && entity.y > protag.y){
                        event.direction = "up";
                        this.last = entity.direction;
                    }
                    if(entity.x < protag.x  && entity.y == protag.y){
                        event.direction = "right";
                        this.last = entity.direction;
                    }
                    if(entity.x > protag.x && entity.y == protag.y){
                        event.direction = "left";
                        this.last = entity.direction;
                    }
                }else if(event.direction == "$"){
                    event.direction = this.last;
                }
            }
            const eventHandler = new Event({map:this,event:event});
            await eventHandler.execute();
            if (event.flag){
                if (event.flag == "zeph-cut"){
                    this.removeWall(this.entities['zeph'].x,this.entities['zeph'].y);
                    delete this.entities['zeph']
                }
                if (event.flag == "veeNote"){
                    this.world.flags.veeNote = true;
                }
            }
        }
        this.ready = true;
        Object.values(this.entities).forEach(entity => {
            entity.executeAgenda(this);
        });
    }
    async checkMove(){
        let protag = this.entities['protag'];
        let jumpPoint = this.jumpPoints[`${protag.x},${protag.y}`];
        if (this.ready && jumpPoint) {
            let eh = new Event({map:this,event:{type:"newMap",map:jumpPoint.map}});
            await eh.execute();
            this.dead = true;
            protag.startx = protag.x;
            protag.starty = protag.y + 16;
            this.removeWall(protag.x,protag.y,this.id);
            protag.direction = "down"
        }
    }
    async checkInteract(){
        let protag = this.entities['protag'];
        let lookCoords = utils.nextPosition(protag.x, protag.y, protag.direction);
        let jumpPoint = this.jumpPoints[`${lookCoords.x},${lookCoords.y}`];
        if (this.ready && jumpPoint) {
            let eh = new Event({map:this,event:{type:"newMap",map:jumpPoint.map}});
            await eh.execute();
            this.dead = true;
            protag.startx = protag.x;
            protag.starty = protag.y;
            this.removeWall(protag.x,protag.y,this.id);
            protag.direction = "down"
        }
    }
    interact(){
        if (this.interacting)return;
        this.interacting = true;
        let protag = this.entities['protag'];
        let lookCoords = utils.nextPosition(protag.x, protag.y, protag.direction);
        let look = Object.values(this.poi).find(poi =>  poi.x == lookCoords.x/16 && poi.y == lookCoords.y/16);
        
        if (look){
            if (look.flag){
                if (look.flag.food){
                    if (this.world.flags.hasMap){
                        look.interactEvent[0].message="That looks like enough food to make the trip, I'm sure Dani wouldn't mind.";
                        look.interactEvent[0].response="<i>Take it</i>";
                        this.lowerMap.src = "/images/FindingVee/maps/daniFood.png"
                        for (let i = 0; i < this.poi.length; i++) {
                            if (this.poi[i].flag == look.flag){
                                delete this.poi[i];
                            }
                        }
                    }
                }
                if (look.flag.maps){
                    if (this.world.flags.maps == true){
                        if (this.world.flags.spots){
                            look.interactEvent[1].message="<i>You rummage around in the box</i>";
                            look.interactEvent[1].response="<i>...</i>";
                            look.interactEvent[2].message="<i>You find a map that looks like it will find the holes</i>";
                            look.interactEvent[2].response="<i>Take it</i>";
                            this.world.flags.hasMap = true;
                            for (let i = 0; i < this.poi.length; i++) {
                                if (this.poi[i].flag == look.flag){
                                    delete this.poi[i];
                                }
                            }
                        }
                    }
                }
                if (look.flag.spots){
                    if (this.world.flags.spots && this.world.flags.hasMap){
                        look.interactEvent[1].message="<i>You line the map up to the holes and you realised, Vee went North";
                        look.interactEvent[1].response="<i>...</i>";
                        this.world.flags.food == true ? look.interactEvent[1].message+=" and the journey looks like it would take a few days. Good thing you have the picnic basket" : look.interactEvent[1].message+=" and the journey looks like it would take a few days, you should find some food.";
                    }
                    if (!this.world.flags.hasMap && this.world.flags.maps){
                        look.interactEvent[1].message="<i>Maybe one of those maps fits the holes</i>";
                        look.interactEvent[1].response="<i>...</i>";
                    }
                }
                if (look.flag.end){
                    if (this.world.flags.food && this.world.flags.hasMap){
                        look.interactEvent[0].message="<i>You depart with the picnic basket down the path, on your way to Vee</i>";
                        look.interactEvent[0].response="<i>Head on the journey</i>";
                        look.interactEvent.push({type:"newMap",map:"final"});
                    }
                    if (!this.world.flags.food && this.world.flags.hasMap){
                        look.interactEvent[0].message="You won't have enough food to make the journey";
                        look.interactEvent[0].response="<i>Turn back and find some</i>";
                    }
                }
                this.world.flags[Object.keys(look.flag)[0]] = true;
            }
        }
        if (look && this.ready) {
            this.cutscene(look.interactEvent)
        }
        let ent = Object.values(this.entities).find(entity => {
            return entity.x == lookCoords.x && entity.y == lookCoords.y
        });
        if (ent && this.ready) {
            if (ent.lines.length == 1){
                this.cutscene(ent.lines[0])

            }
            else if (ent.lines.length > 1){
                this.cutscene(ent.lines.shift());
            }
        }
        this.interacting = false;
    }
    addWall(x, y,id) {
        this.walls[`${x},${y}`] = id;
    }
    removeWall(x, y) {
        delete this.walls[`${x},${y}`];
    }
    moveWall(wx, wy, direction,id) {
        delete this.walls[`${wx},${wy}`];
        for (let wall in this.walls) {
            if (this.walls[wall] == id) {
                delete this.walls[wall];
            }
        }
        let {x,y} = utils.nextPosition(wx, wy, direction);
        // if x or y is not a multiple of 16, make it so
        x = x - x % 16;
        y = y - y % 16;
        this.walls[`${x},${y}`] = id;
        
        
    }
}

window.Maps = {
    HearthTown: {
        lowerMapSrc: '/images/FindingVee/maps/Hearth.png',
        upperMapSrc: '/images/FindingVee/maps/Empty.png',
        walls: {
            [utils.asGridCoord(-1,0)]: true,
            [utils.asGridCoord(-1,1)]: true,
            [utils.asGridCoord(-1,2)]: true,
            [utils.asGridCoord(-1,3)]: true,
            [utils.asGridCoord(-1,4)]: true,
            [utils.asGridCoord(-1,5)]: true,
            [utils.asGridCoord(-1,6)]: true,
            [utils.asGridCoord(-1,7)]: true,
            [utils.asGridCoord(-1,8)]: true,
            [utils.asGridCoord(-1,9)]: true,
            [utils.asGridCoord(-1,10)]: true,
            [utils.asGridCoord(-1,11)]: true,
            [utils.asGridCoord(-1,12)]: true,
            [utils.asGridCoord(-1,13)]: true,
            [utils.asGridCoord(-1,14)]: true,
            [utils.asGridCoord(-1,15)]: true,
            [utils.asGridCoord(-1,16)]: true,
            [utils.asGridCoord(-1,17)]: true,
            [utils.asGridCoord(-1,18)]: true,
            [utils.asGridCoord(-1,19)]: true,
            [utils.asGridCoord(-1,20)]: true,
            [utils.asGridCoord(-1,21)]: true,
            [utils.asGridCoord(-1,22)]: true,
            [utils.asGridCoord(-1,23)]: true,
            [utils.asGridCoord(-1,24)]: true,
            [utils.asGridCoord(3,4)]: true,
            [utils.asGridCoord(3,5)]: true,
            [utils.asGridCoord(3,6)]: true,
            [utils.asGridCoord(4,4)]: true,
            [utils.asGridCoord(4,5)]: true,
            [utils.asGridCoord(4,6)]: true,
            [utils.asGridCoord(2,4)]: true,
            [utils.asGridCoord(2,5)]: true,
            [utils.asGridCoord(2,6)]: true,
            [utils.asGridCoord(1,5)]: true,
            [utils.asGridCoord(0,5)]: true,
            [utils.asGridCoord(5,7)]: true,
            [utils.asGridCoord(11,6)]: true,
            [utils.asGridCoord(11,5)]: true,
            [utils.asGridCoord(7,11)]: true,
            [utils.asGridCoord(11,11)]: true,
            [utils.asGridCoord(11,17)]: true,
            [utils.asGridCoord(7,17)]: true,
            [utils.asGridCoord(13,17)]: true,
            [utils.asGridCoord(6,17)]: true,
            [utils.asGridCoord(6,15)]: true,
            [utils.asGridCoord(6,16)]: true,
            [utils.asGridCoord(5,11)]: true,
            [utils.asGridCoord(17,11)]: true,
            [utils.asGridCoord(0,22)]: true,
            [utils.asGridCoord(1,22)]: true,
            [utils.asGridCoord(2,22)]: true,
            [utils.asGridCoord(3,22)]: true,
            [utils.asGridCoord(4,22)]: true,
            [utils.asGridCoord(5,22)]: true,
            [utils.asGridCoord(6,22)]: true,
            [utils.asGridCoord(7,22)]: true,
            [utils.asGridCoord(8,23)]: true,
            [utils.asGridCoord(9,23)]: true,
            [utils.asGridCoord(10,23)]: true,
            [utils.asGridCoord(11,22)]: true,
            [utils.asGridCoord(12,22)]: true,
            [utils.asGridCoord(13,22)]: true,
            [utils.asGridCoord(14,22)]: true,
            [utils.asGridCoord(15,22)]: true,
            [utils.asGridCoord(16,22)]: true,
            [utils.asGridCoord(17,22)]: true,
            [utils.asGridCoord(18,22)]: true,
            [utils.asGridCoord(0,1)]: true,
            [utils.asGridCoord(1,1)]: true,
            [utils.asGridCoord(2,1)]: true,
            [utils.asGridCoord(3,1)]: true,
            [utils.asGridCoord(4,1)]: true,
            [utils.asGridCoord(5,1)]: true,
            [utils.asGridCoord(6,1)]: true,
            [utils.asGridCoord(7,1)]: true,
            [utils.asGridCoord(11,1)]: true,
            [utils.asGridCoord(12,1)]: true,
            [utils.asGridCoord(13,1)]: true,
            [utils.asGridCoord(14,1)]: true,
            [utils.asGridCoord(15,1)]: true,
            [utils.asGridCoord(16,1)]: true,
            [utils.asGridCoord(17,1)]: true,
            [utils.asGridCoord(18,1)]: true,
            [utils.asGridCoord(19,0)]: true,
            [utils.asGridCoord(19,1)]: true,
            [utils.asGridCoord(19,2)]: true,
            [utils.asGridCoord(19,3)]: true,
            [utils.asGridCoord(19,4)]: true,
            [utils.asGridCoord(19,5)]: true,
            [utils.asGridCoord(19,6)]: true,
            [utils.asGridCoord(19,7)]: true,
            [utils.asGridCoord(19,8)]: true,
            [utils.asGridCoord(19,9)]: true,
            [utils.asGridCoord(19,10)]: true,
            [utils.asGridCoord(19,11)]: true,
            [utils.asGridCoord(19,12)]: true,
            [utils.asGridCoord(19,13)]: true,
            [utils.asGridCoord(19,14)]: true,
            [utils.asGridCoord(19,15)]: true,
            [utils.asGridCoord(19,16)]: true,
            [utils.asGridCoord(19,17)]: true,
            [utils.asGridCoord(19,18)]: true,
            [utils.asGridCoord(19,19)]: true,
            [utils.asGridCoord(19,20)]: true,
            [utils.asGridCoord(19,21)]: true,
            [utils.asGridCoord(19,22)]: true,
            [utils.asGridCoord(19,23)]: true,
            [utils.asGridCoord(19,24)]: true,
            [utils.asGridCoord(7,1)]: true,
            [utils.asGridCoord(7,0)]: true,
            [utils.asGridCoord(11,1)]: true,
            [utils.asGridCoord(11,0)]: true,
            [utils.asGridCoord(8,-1)]: true,
            [utils.asGridCoord(9,-1)]: true,
            [utils.asGridCoord(10,-1)]: true,
            [utils.asGridCoord(3,8)]: true,
            [utils.asGridCoord(1,9)]: true,
            [utils.asGridCoord(2,9)]: true,
            [utils.asGridCoord(2,10)]: true,
            [utils.asGridCoord(1,10)]: true,
            [utils.asGridCoord(4,9)]: true,
            [utils.asGridCoord(4,10)]: true,
            [utils.asGridCoord(3,14)]: true,
            [utils.asGridCoord(3,15)]: true,
            [utils.asGridCoord(3,16)]: true,
            [utils.asGridCoord(2,16)]: true,
            [utils.asGridCoord(2,15)]: true,
            [utils.asGridCoord(4,16)]: true,
            [utils.asGridCoord(4,15)]: true,
            [utils.asGridCoord(4,17)]: true,
            [utils.asGridCoord(15,16)]: true,
            [utils.asGridCoord(15,15)]: true,
            [utils.asGridCoord(15,14)]: true,
            [utils.asGridCoord(14,15)]: true,
            [utils.asGridCoord(16,15)]: true,
            [utils.asGridCoord(16,16)]: true,
            [utils.asGridCoord(14,16)]: true,
            [utils.asGridCoord(14,10)]: true,
            [utils.asGridCoord(14,9)]: true,
            [utils.asGridCoord(15,8)]: true,
            [utils.asGridCoord(15,9)]: true,
            [utils.asGridCoord(15,10)]: true,
            [utils.asGridCoord(16,9)]: true,
            [utils.asGridCoord(16,10)]: true,
            [utils.asGridCoord(17,10)]: true,
            [utils.asGridCoord(17,9)]: true,
            [utils.asGridCoord(16,5)]: true,
            [utils.asGridCoord(16,4)]: true,
            [utils.asGridCoord(15,3)]: true,
            [utils.asGridCoord(15,4)]: true,
            [utils.asGridCoord(15,5)]: true,
            [utils.asGridCoord(16,5)]: true,
            [utils.asGridCoord(16,4)]: true,
            [utils.asGridCoord(3,10)]: true,
        },
        entities: {
            protag : new ComplexEntity({
                x: utils.withGrid(15),
                y: utils.withGrid(7),
                startx: utils.withGrid(15),
                starty: utils.withGrid(7),
                src: '/images/FindingVee/characters/nao.png',
                height: 16,
                width: 16,
                animations: {
                   "default": [[16, 0]],
                   "idle-down": [[16, 0]],
                   "idle-left": [[16, 16]],
                   "idle-right": [[16, 32]],
                   "idle-up": [[16, 48]],
                   "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
                   "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
                   "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
                   "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
                },
                isPlayer: true,
                speed: 1,
            }),
            fire: new Entity({
                x: utils.withGrid(3),
                y: utils.withGrid(3),
                startx: utils.withGrid(3),
                starty: utils.withGrid(3),
                src: '/images/FindingVee/items/fire.png',
                height: 16,
                width: 16,
                animations: {
                   "default": [[0, 0], [16, 0], [32, 0], [48, 0]],
                },
            }),
            em: new ComplexEntity({
                x: utils.withGrid(9),
                y: utils.withGrid(22),
                startx: utils.withGrid(9),
                starty: utils.withGrid(22),
                src: '/images/FindingVee/characters/em.png',
                height: 16,
                width: 16,
                animations: {
                    "default": [[16, 0]],
                    "idle-down": [[16, 0]],
                    "idle-left": [[16, 16]],
                    "idle-right": [[16, 32]],
                    "idle-up": [[16, 48]],
                    "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
                    "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
                    "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
                    "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
                 },
                 isPlayer: false,
                 lines:[
                    [{id:"em",type:"look",direction:""},{type:"message",message:"\"I can't BEElieve Vee is gone!\"",response:"..."},{id:"em",type:"look",direction:"$"}],
                    [{id:"em",type:"look",direction:""},{type:"message",message:"\"HI've been worried sick about Dani ever since Vee disappeared\"",response:"..."},{id:"em",type:"look",direction:"$"}],
                    [{id:"em",type:"look",direction:""},{type:"message",message:"\"You have to wonder Wax exactly is Vee up to?\"",response:"..."},{id:"em",type:"look",direction:"$"}],
                    [{id:"em",type:"look",direction:""},{type:"message",message:"\"It hurts to see Dani hurting like this\"",response:"..."},{id:"em",type:"look",direction:"$"}],
                    [{id:"em",type:"look",direction:""},{type:"message",message:"\"Its so nice to be out of Elysium\"",response:"..."},{id:"em",type:"look",direction:"$"}],
                    [{id:"em",type:"look",direction:""},{type:"message",message:"\"Dani has done so much for me, I hope they can find Vee again.\"",response:"..."},{id:"em",type:"look",direction:"$"}],
                    [{id:"em",type:"look",direction:""},{type:"message",message:"\"Nothing is ever beyond repair, there is nothing that can't be talked through.\"",response:"..."},{id:"em",type:"look",direction:"$"}],
                    [{id:"em",type:"look",direction:""},{type:"message",message:"\"Vee and I may have had our history but I hope nothing happened to him!\"",response:"..."},{id:"em",type:"look",direction:"$"}],
                 ]
            }),
        },
        poi:[
            {x:3, y:3, interactEvent:[{type:"message", message:"A burning campfire, its base is purple, white in the middle and orange flames on the top.",response:"Intersting Colors..."}]},
            {x:-1,y:4, interactEvent:[{type:"message", message:"In the distance you hear yells",response:"What is that??"},{type:"message", message:"The yells become more clear\"Let me in, LET ME IN\"",response:"Oh, its just Estera"}]},
            {x:1,y:5, interactEvent:[{type:"message", message:"Someone has scrapped\"Spuink wuz here\"into the rock.",response:"Oh SpunkTV."}]},
            {x:2,y:5, interactEvent:[{type:"message", message:"Someone has scrapped\"Spuink wuz here\"into the rock.",response:"Oh SpunkTV."}]},
            {x:5,y:7, interactEvent:[{type:"message", message:"You don't know how, but in some way, this rock is disappointed in you.",response:":\("}]},
            {x:11,y:6, interactEvent:[{type:"message", message:"You haven't gotten around to whittling your name into the sign yet",response:"Some day, when this feels less like a dream"}]},
            {x:7,y:11, interactEvent:[{type:"message", message:"Dani lives here",response:"..."}]},
            {x:11,y:11, interactEvent:[{type:"message", message:"Zeph lives here",response:"..."}]},
            {x:11,y:17, interactEvent:[{type:"message", message:"Em lives here",response:"..."}]},
            {x:7,y:17, interactEvent:[{type:"message", message:"Vee lives here",response:"or... Lived? here."}]},
            {x:8,y:-1, interactEvent:[{type:"message", message:"You should not leave while Vee is still mising",response:"<i>Turn back</i>"}],flag:{end:true}},
            {x:9,y:-1, interactEvent:[{type:"message", message:"You should not leave while Vee is still mising",response:"<i>Turn back</i>"}],flag:{end:true}},
            {x:10,y:-1, interactEvent:[{type:"message", message:"You should not leave while Vee is still mising",response:"<i>Turn back</i>"}],flag:{end:true}},
            {x:11,y:9, interactEvent:[{type:"message", message:"Hmm, I wonder what the colours mean",response:"Pretty anyway"}]},
            {x:12,y:9, interactEvent:[{type:"message", message:"Hmm, I wonder what the colours mean",response:"Pretty anyway"}]},
            {x:13,y:9, interactEvent:[{type:"message", message:"Hmm, I wonder what the colours mean",response:"Pretty anyway"}]},
            {x:6,y:16, interactEvent:[{type:"message", message:"Oh, A crab apple tree!",response:"Sadly not edible"}]},
            {x:6,y:17, interactEvent:[{type:"message", message:"A beautiful flower box full of begonia flowers",response:"I doubt Vee planted them himself"}]},
            {x:4,y:17, interactEvent:[{type:"message", message:"The mail box is full with letters that haven't been responded to",response:"Vee must hate this \"Nao\" person"}]},
            {x:13,y:17, interactEvent:[{type:"message", message:"A flower box of sunflowers",response:"how cute!"}]},
            {x:5,y:11, interactEvent:[{type:"message", message:"A flower box of dandelions",response:"Who says wild flowers aren't pretty!"}]},
            {x:17,y:11, interactEvent:[{type:"message", message:"A small flower box of... hang on that's just ice cream on top of some roses",response:"How long has that been there?"}]},

        ],
        jumpPoints:{
            [utils.asGridCoord(15,6)]:{map:"protagCabin"},
            [utils.asGridCoord(15,11)]:{map:"zephCabin"},
            [utils.asGridCoord(15,17)]:{map:"emCabin"},
            [utils.asGridCoord(3,17)]:{map:"veeCabin"},
            [utils.asGridCoord(3,11)]:{map:"daniCabin"},
        }
    },
    protagCabin:{
        lowerMapSrc:"/images/FindingVee/maps/protag.png",
        upperMapSrc:"/images/FindingVee/maps/empty.png",
        walls:{
            [utils.asGridCoord(-1,0)]:"pre",
            [utils.asGridCoord(-1,1)]:"pre",
            [utils.asGridCoord(-1,2)]:"pre",
            [utils.asGridCoord(-1,3)]:"pre",
            [utils.asGridCoord(-1,4)]:"pre",
            [utils.asGridCoord(-1,5)]:"pre",
            [utils.asGridCoord(-1,6)]:"pre",
            [utils.asGridCoord(-1,7)]:"pre",
            [utils.asGridCoord(9,0)]:"pre",
            [utils.asGridCoord(9,1)]:"pre",
            [utils.asGridCoord(9,2)]:"pre",
            [utils.asGridCoord(9,3)]:"pre",
            [utils.asGridCoord(9,4)]:"pre",
            [utils.asGridCoord(9,5)]:"pre",
            [utils.asGridCoord(9,6)]:"pre",
            [utils.asGridCoord(9,7)]:"pre",
            [utils.asGridCoord(0,8)]:"pre",
            [utils.asGridCoord(1,8)]:"pre",
            [utils.asGridCoord(2,8)]:"pre",
            [utils.asGridCoord(3,8)]:"pre",
            [utils.asGridCoord(4,8)]:"pre",
            [utils.asGridCoord(5,8)]:"pre",
            [utils.asGridCoord(6,8)]:"pre",
            [utils.asGridCoord(7,8)]:"pre",
            [utils.asGridCoord(8,8)]:"pre",
            [utils.asGridCoord(1,2)]:"pre",
            [utils.asGridCoord(2,2)]:"pre",
            [utils.asGridCoord(3,2)]:"pre",
            [utils.asGridCoord(4,2)]:"pre",
            [utils.asGridCoord(5,2)]:"pre",
            [utils.asGridCoord(6,2)]:"pre",
            [utils.asGridCoord(7,2)]:"pre",
            [utils.asGridCoord(8,2)]:"pre",
            [utils.asGridCoord(6,4)]:"pre",
            [utils.asGridCoord(7,4)]:"pre",
            [utils.asGridCoord(6,3)]:"pre",
            [utils.asGridCoord(7,3)]:"pre",
            [utils.asGridCoord(0,2)]:"pre",
            [utils.asGridCoord(1,2)]:"pre",
        },
        entities:{protag : new ComplexEntity({
            x: utils.withGrid(0),
            y: utils.withGrid(3),
            startx: utils.withGrid(0),
            starty: utils.withGrid(3),
            src: '/images/FindingVee/characters/nao.png',
            height: 16,
            width: 16,
            animations: {
               "default": [[16, 0]],
               "idle-down": [[16, 0]],
               "idle-left": [[16, 16]],
               "idle-right": [[16, 32]],
               "idle-up": [[16, 48]],
               "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
               "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
               "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
               "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
            },
            isPlayer: true,
            speed:1,
        }),},
        poi:[
            {x:7,y:3, interactEvent:[{type:"message", message:"Looks cozy enough, but now isn't the time for a nap.",response:"..."}]},
            {x:7,y:4, interactEvent:[{type:"message", message:"Looks cozy enough, but now isn't the time for a nap.",response:"..."}]},
            {x:6,y:3, interactEvent:[{type:"message", message:"Looks cozy enough, but now isn't the time for a nap.",response:"..."}]},
            {x:6,y:4, interactEvent:[{type:"message", message:"Looks cozy enough, but now isn't the time for a nap.",response:"..."}]},
            {x:2,y:2, interactEvent:[{type:"message", message:"Hmm, looks like someone left some book-. HEY Minecraft For Dumbies??",response:"Rude!"}]},
            {x:3,y:2, interactEvent:[{type:"message", message:"Hmm, looks like someone left some book-. HEY Minecraft For Dumbies??",response:"Rude!"}]},
            {x:4,y:2, interactEvent:[{type:"message", message:"I am concerned that instead of someone wanting something in the wall... something in the wall wanted out.",response:"<i>don't panic</i>"}]},
            {x:5,y:2, interactEvent:[{type:"message", message:"I am concerned that instead of someone wanting something in the wall... something in the wall wanted out.",response:"<i>don't panic</i>"}]},
        ],
        jumpPoints:{
            [utils.asGridCoord(0,3)]:{map:"HearthTown"},
        },
    },
    zephCabin:{
        lowerMapSrc:"/images/FindingVee/maps/zeph.png",
        upperMapSrc:"/images/FindingVee/maps/empty.png",
        walls:{
            [utils.asGridCoord(-1,0)]:"pre",
            [utils.asGridCoord(-1,1)]:"pre",
            [utils.asGridCoord(-1,2)]:"pre",
            [utils.asGridCoord(-1,3)]:"pre",
            [utils.asGridCoord(-1,4)]:"pre",
            [utils.asGridCoord(-1,5)]:"pre",
            [utils.asGridCoord(-1,6)]:"pre",
            [utils.asGridCoord(-1,7)]:"pre",
            [utils.asGridCoord(0,2)]:"pre",
            [utils.asGridCoord(1,2)]:"pre",
            [utils.asGridCoord(2,2)]:"pre",
            [utils.asGridCoord(3,2)]:"pre",
            [utils.asGridCoord(4,2)]:"pre",
            [utils.asGridCoord(5,2)]:"pre",
            [utils.asGridCoord(6,2)]:"pre",
            [utils.asGridCoord(7,2)]:"pre",
            [utils.asGridCoord(8,2)]:"pre",
            [utils.asGridCoord(9,2)]:"pre",
            [utils.asGridCoord(9,3)]:"pre",
            [utils.asGridCoord(9,4)]:"pre",
            [utils.asGridCoord(9,5)]:"pre",
            [utils.asGridCoord(9,6)]:"pre",
            [utils.asGridCoord(9,7)]:"pre",
            [utils.asGridCoord(0,8)]:"pre",
            [utils.asGridCoord(1,8)]:"pre",
            [utils.asGridCoord(2,8)]:"pre",
            [utils.asGridCoord(3,8)]:"pre",
            [utils.asGridCoord(4,8)]:"pre",
            [utils.asGridCoord(5,8)]:"pre",
            [utils.asGridCoord(6,8)]:"pre",
            [utils.asGridCoord(7,8)]:"pre",
            [utils.asGridCoord(5,3)]:"pre",
            [utils.asGridCoord(6,3)]:"pre",
            [utils.asGridCoord(7,3)]:"pre",
            [utils.asGridCoord(8,3)]:"pre",
            [utils.asGridCoord(8,5)]:"pre",
            [utils.asGridCoord(8,6)]:"pre",
            [utils.asGridCoord(8,7)]:"pre",
            [utils.asGridCoord(3,7)]:"pre",
            [utils.asGridCoord(4,7)]:"pre",
            [utils.asGridCoord(5,7)]:"pre",
            [utils.asGridCoord(0,7)]:"pre",
            [utils.asGridCoord(1,7)]:"pre",
            [utils.asGridCoord(0,3)]:"pre",
            [utils.asGridCoord(1,3)]:"pre",
            [utils.asGridCoord(2,3)]:"pre",
            [utils.asGridCoord(0,4)]:"pre",
            [utils.asGridCoord(1,4)]:"pre",
            [utils.asGridCoord(2,4)]:"pre",
            [utils.asGridCoord(0,6)]:"pre",
            [utils.asGridCoord(1,6)]:"pre",
            [utils.asGridCoord(3,6)]:"pre",
            [utils.asGridCoord(4,6)]:"pre",
            [utils.asGridCoord(5,6)]:"pre",
        },
        entities:{protag : new ComplexEntity({
            x: utils.withGrid(4),
            y: utils.withGrid(4),
            startx: utils.withGrid(4),
            starty: utils.withGrid(4),
            src: '/images/FindingVee/characters/nao.png',
            height: 16,
            width: 16,
            animations: {
               "default": [[16, 0]],
               "idle-down": [[16, 0]],
               "idle-left": [[16, 16]],
               "idle-right": [[16, 32]],
               "idle-up": [[16, 48]],
               "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
               "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
               "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
               "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
            },
            isPlayer: true,
            speed:1,
        }),
        zeph: new ComplexEntity({
            x: utils.withGrid(7),
            y: utils.withGrid(7),
            startx: utils.withGrid(7),
            starty: utils.withGrid(7),
            src: '/images/FindingVee/characters/zeph.png',
            height: 16,
            width: 16,
            animations: {
                "default": [[16, 0]],
                "idle-down": [[16, 0]],
                "idle-left": [[16, 16]],
                "idle-right": [[16, 32]],
                "idle-up": [[16, 48]],
                "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
                "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
                "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
                "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
             },
            isPlayer: false,
            speed:1,
            direction:"right",
            lines:[
                [{id:"zeph",type:"look",direction:""},{type:"message",message:"\"This ice cream is so foxing good.\"",response:"Why am I just hearing about this now??"},{id:"zeph",type:"look",direction:"$"},],
                [{id:"zeph",type:"look",direction:""},{type:"message",message:"\"Have you tried the sprinkles yet?\"",response:"Oh my god you have sprinkels too?"},{id:"zeph",type:"look",direction:"$"},],
                [{id:"zeph",type:"look",direction:""},{type:"message",message:"\"I hope foxes aren't allergic to ice cream?\"",response:"As long as it's not chocolate I guess?"},{id:"zeph",type:"look",direction:"$"},],
                [{id:"zeph",type:"look",direction:""},{type:"message",message:"\"Do not disturb, I am busy NOMING\"",response:"sorry!"},{id:"zeph",type:"look",direction:"$"},],
                [{id:"zeph",type:"look",direction:""},{type:"message",message:"\"Its so nice to be out of Elysium\"",response:"..."},{id:"zeph",type:"look",direction:"$"},],
                [{id:"zeph",type:"look",direction:""},{type:"message",message:"\"Dani has done so much for me, I hope they can find Vee again.\"",response:"..."},{id:"zeph",type:"look",direction:"$"},],
                [{id:"zeph",type:"look",direction:""},{type:"message",message:"\"Nothing is ever beyond repair, there is nothing that can't be talked through.\"",response:"..."},{id:"zeph",type:"look",direction:"$"},],
                [{id:"zeph",type:"look",direction:""},{type:"message",message:"\"Vee and I may have had our history but I hope nothing happened to him!\"",response:"..."},{id:"zeph",type:"look",direction:"$"},],
            ]
        }),},
        poi:[
            {x:2, y:3,interactEvent:[{type:"message", message:"An ice cream bar and drums?",response:"Zeph is a highkey badass"}]},
            {x:2, y:4,interactEvent:[{type:"message", message:"An ice cream bar and drums?",response:"Zeph is a highkey badass"}]},
            {x:2, y:3,interactEvent:[{type:"message", message:"An ice cream bar and drums?",response:"Zeph is a highkey badass"}]},
            {x:1, y:4,interactEvent:[{type:"message", message:"An ice cream bar and drums?",response:"Zeph is a highkey badass"}]},
            {x:0, y:4,interactEvent:[{type:"message", message:"An ice cream bar and drums?",response:"Zeph is a highkey badass"}]},
            {x:5,y:3,interactEvent:[{type:"message", message:"They have cones! AND WAFFLE CONES",response:"<i>nom nom nom nom</i>"}]},
            {x:6,y:3,interactEvent:[{type:"message", message:"How long has he been hoarding the ice cream?",response:"low key jealous"}]},
            {x:7,y:3,interactEvent:[{type:"message", message:"<i>A sign reads \"Flavours of the day: Vanilla and French Vanilla\"",response:"pfffft. what a diverse selection"}]},
            {x:8,y:3,interactEvent:[{type:"message", message:"<i>A sign reads \"Flavours of the day: Vanilla and French Vanilla\"",response:"pfffft. what a diverse selection"}]},
            {x:8,y:5,interactEvent:[{type:"message", message:"A green sundae of some kind",response:"How mad would he be if I had it?"}]},
            {x:8,y:6,interactEvent:[{type:"message", message:"Lord only knows what this blue, orange and red monstrosity this is",response:"I don't even want to steal it"}]}
        ],
        jumpPoints:{
            [utils.asGridCoord(4,3)]:{map:"HearthTown"},
        },
    },
    emCabin:{
        lowerMapSrc:"/images/FindingVee/maps/em.png",
        upperMapSrc:"/images/FindingVee/maps/empty.png",
        walls:{
            [utils.asGridCoord(-1,0)]:"pre",
            [utils.asGridCoord(-1,1)]:"pre",
            [utils.asGridCoord(-1,2)]:"pre",
            [utils.asGridCoord(-1,3)]:"pre",
            [utils.asGridCoord(-1,4)]:"pre",
            [utils.asGridCoord(-1,5)]:"pre",
            [utils.asGridCoord(-1,6)]:"pre",
            [utils.asGridCoord(-1,7)]:"pre",
            [utils.asGridCoord(0,2)]:"pre",
            [utils.asGridCoord(1,2)]:"pre",
            [utils.asGridCoord(2,2)]:"pre",
            [utils.asGridCoord(3,2)]:"pre",
            [utils.asGridCoord(4,2)]:"pre",
            [utils.asGridCoord(5,2)]:"pre",
            [utils.asGridCoord(6,2)]:"pre",
            [utils.asGridCoord(7,2)]:"pre",
            [utils.asGridCoord(8,2)]:"pre",
            [utils.asGridCoord(9,2)]:"pre",
            [utils.asGridCoord(9,3)]:"pre",
            [utils.asGridCoord(9,4)]:"pre",
            [utils.asGridCoord(9,5)]:"pre",
            [utils.asGridCoord(9,6)]:"pre",
            [utils.asGridCoord(9,7)]:"pre",
            [utils.asGridCoord(0,8)]:"pre",
            [utils.asGridCoord(1,8)]:"pre",
            [utils.asGridCoord(2,8)]:"pre",
            [utils.asGridCoord(3,8)]:"pre",
            [utils.asGridCoord(4,8)]:"pre",
            [utils.asGridCoord(5,8)]:"pre",
            [utils.asGridCoord(6,8)]:"pre",
            [utils.asGridCoord(7,8)]:"pre",
            [utils.asGridCoord(0,3)]:"pre",
            [utils.asGridCoord(1,3)]:"pre",
            [utils.asGridCoord(2,3)]:"pre",
            [utils.asGridCoord(3,3)]:"pre",
            [utils.asGridCoord(6,3)]:"pre",
            [utils.asGridCoord(7,3)]:"pre",
            [utils.asGridCoord(8,3)]:"pre",
            [utils.asGridCoord(0,6)]:"pre",
            [utils.asGridCoord(1,6)]:"pre",
            [utils.asGridCoord(2,6)]:"pre",
            [utils.asGridCoord(3,6)]:"pre",
            [utils.asGridCoord(4,6)]:"pre",
            [utils.asGridCoord(5,6)]:"pre",
            [utils.asGridCoord(6,6)]:"pre",
            [utils.asGridCoord(7,6)]:"pre",
            [utils.asGridCoord(8,6)]:"pre",

        },
        entities:{protag : new ComplexEntity({
            x: utils.withGrid(4),
            y: utils.withGrid(4),
            startx: utils.withGrid(4),
            starty: utils.withGrid(4),
            src: '/images/FindingVee/characters/nao.png',
            height: 16,
            width: 16,
            animations: {
               "default": [[16, 0]],
               "idle-down": [[16, 0]],
               "idle-left": [[16, 16]],
               "idle-right": [[16, 32]],
               "idle-up": [[16, 48]],
               "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
               "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
               "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
               "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
            },
            isPlayer: true,
            speed:1,
        }),},
        poi:[
            {x:0,y:3, interactEvent:[{type:"message", message:"A beautiful bouquet of flowers",response:"<i>sniff</i>"}]},
            {x:1,y:3, interactEvent:[{type:"message", message:"Some purple wild flowers and a flowering succulent",response:"<i>lick</i>"}]},
            {x:2,y:3, interactEvent:[{type:"message", message:"A fancy lamp",response:"Oh la la"}]},
            {x:6,y:3, interactEvent:[{type:"message", message:"A prickly succulent",response:"<i>touch</i>"}]},
            {x:7,y:3, interactEvent:[{type:"message", message:"Yet another succulent",response:"I bet his name is Alfred"}]},
            {x:8,y:3, interactEvent:[{type:"message", message:"Hehe, this plant looks like a hat",response:"Your head is too big to wear it :("}]},
            {x:0,y:6, interactEvent:[{type:"message", message:"A cute lil succulent",response:"<i>play with</i>"}]},
            {x:1,y:6, interactEvent:[{type:"message", message:"Like everything else, the bed is green",response:"..."}]},
            {x:2,y:6, interactEvent:[{type:"message", message:"Like everything else, the bed is green",response:"..."}]},
            {x:3,y:6, interactEvent:[{type:"message", message:"A fern!",response:"I think..."}]},
            {x:4,y:6, interactEvent:[{type:"message", message:"A plant with a fancy hat",response:"Does it come in red?"}]},
            {x:5,y:6, interactEvent:[{type:"message", message:"It looks prickly but cuddly",response:"<i>Hug it</i>"}]},
            {x:6,y:6, interactEvent:[{type:"message", message:"Many prickly succulent",response:"<i>jump into</i>"}]},
            {x:7,y:6, interactEvent:[{type:"message", message:"Even more succulents",response:"how does Em keep track of them all"}]},
            {x:8,y:6, interactEvent:[{type:"message", message:"Wait, is this a fern?",response:"plant names are dumb."}]},
            
        ],
        jumpPoints:{
            [utils.asGridCoord(4,3)]:{map:"HearthTown"},
        },
    },
    daniCabin:{
        lowerMapSrc:"/images/FindingVee/maps/dani.png",
        upperMapSrc:"/images/FindingVee/maps/empty.png",
        walls:{
            [utils.asGridCoord(-1,3)]:"pre",
            [utils.asGridCoord(-1,4)]:"pre",
            [utils.asGridCoord(-1,5)]:"pre",
            [utils.asGridCoord(-1,6)]:"pre",
            [utils.asGridCoord(-1,7)]:"pre",
            [utils.asGridCoord(9,3)]:"pre",
            [utils.asGridCoord(9,4)]:"pre",
            [utils.asGridCoord(9,5)]:"pre",
            [utils.asGridCoord(9,6)]:"pre",
            [utils.asGridCoord(9,7)]:"pre",
            [utils.asGridCoord(0,8)]:"pre",
            [utils.asGridCoord(1,8)]:"pre",
            [utils.asGridCoord(2,8)]:"pre",
            [utils.asGridCoord(3,8)]:"pre",
            [utils.asGridCoord(4,8)]:"pre",
            [utils.asGridCoord(5,8)]:"pre",
            [utils.asGridCoord(6,8)]:"pre",
            [utils.asGridCoord(7,8)]:"pre",
            [utils.asGridCoord(8,8)]:"pre",
            [utils.asGridCoord(8,5)]:"pre",
            [utils.asGridCoord(8,6)]:"pre",
            [utils.asGridCoord(5,5)]:"pre",
            [utils.asGridCoord(6,5)]:"pre",
            [utils.asGridCoord(4,5)]:"pre",
            [utils.asGridCoord(4,6)]:"pre",
            [utils.asGridCoord(5,3)]:"pre",
            [utils.asGridCoord(6,3)]:"pre",
            [utils.asGridCoord(7,3)]:"pre",
            [utils.asGridCoord(8,3)]:"pre",
            [utils.asGridCoord(0,2)]:"pre",
            [utils.asGridCoord(1,2)]:"pre",
            [utils.asGridCoord(2,2)]:"pre",
            [utils.asGridCoord(3,2)]:"pre",
            [utils.asGridCoord(4,2)]:"pre",
        },
        entities:{protag : new ComplexEntity({
            x: utils.withGrid(1),
            y: utils.withGrid(4),
            startx: utils.withGrid(1),
            starty: utils.withGrid(4),
            src: '/images/FindingVee/characters/nao.png',
            height: 16,
            width: 16,
            animations: {
               "default": [[16, 0]],
               "idle-down": [[16, 0]],
               "idle-left": [[16, 16]],
               "idle-right": [[16, 32]],
               "idle-up": [[16, 48]],
               "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
               "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
               "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
               "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
            },
            isPlayer: true,
            speed:1,
        }),
        dani: new ComplexEntity({
            x: utils.withGrid(0),
            y: utils.withGrid(6),
            startx: utils.withGrid(0),
            starty: utils.withGrid(6),
            src: '/images/FindingVee/characters/dani.png',
            height: 16,
            width: 16,
            animations: {
               "default": [[16, 0]],
               "idle-down": [[16, 0]],
               "idle-left": [[16, 16]],
               "idle-right": [[16, 32]],
               "idle-up": [[16, 48]],
               "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
               "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
               "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
               "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
            },
            isPlayer: false,
            agenda:[
                {retry:true,id:"dani",type:"move",direction:"right"},
                {retry:true,id:"dani",type:"idle",time:100},
                {retry:true,id:"dani",type:"move",direction:"right"},
                {retry:true,id:"dani",type:"idle",time:1000},
                {retry:true,id:"dani",type:"look",direction:"left"},
                {retry:true,id:"dani",type:"idle",time:100},
                {retry:true,id:"dani",type:"move",direction:"left"},
                {retry:true,id:"dani",type:"idle",time:100},
                {retry:true,id:"dani",type:"move",direction:"left"},
                {retry:true,id:"dani",type:"idle",time:1000},
                {retry:true,id:"dani",type:"look",direction:"right"},
                {retry:true,id:"dani",type:"idle",time:100},
            ],
            lines:[
                [{id:"dani",type:"look",direction:""},{type:"message",message:"<i>sniffles</i>\"why.. why did you go vee?\"",response:"... Dani?"},
                {type:"message",message:`\"$NAME, thank God.\"<i>sniffles</i> \"Vee left\"`,response:"Where did they go?"},
                {type:"message",message:"\"I... don't know\" <i>Dani begins sobbing</i>",response:"Hey, it's okay... we'll find them."},
                {type:"message",message:"<i>Dani doesn't answer, they just hand you a note</i>",response:"<i>You take the note</i>"},
                {type:"message",message:"<i>It's Vee's handwriting</i> \"Hi Dani, I didn’t want to leave without a goodbye so I’m writing this to you.\"",response:"..."},
                {type:"message",message:"\"I’m not sure how to start this. From the moment I came here, I only wanted to feel welcome. So I hosted the ball.\"",response:"..."},
                {type:"message",message:"\"I was so proud of all the work I did, until it actually happened. The ball, which I was putting all my pride in, just ended up hurting people.\"",response:"..."},
                {type:"message",message:"\"Most importantly, hurting you. I don’t think things ever went back to normal after it. I always felt guilty, I’ll never stop feeling guilty. \"",response:"..."},
                {type:"message",message:"\"I know it’s selfish but it brought me something positive too. I met you and even though I was a walking reminder of Em's death\"",response:"..."},
                {type:"message",message:"\"You still let me stay with you. I considered you family, I still do. Both Em and you felt like home to me.\"",response:"..."},
                {type:"message",message:"\"You just have that warmth surrounding you at all times, no matter how bad it is. You were there for me at my lowest.\"",response:"..."},
                {type:"message",message:"\The only issue is, it never got any better. I thought it could only get better after the ball.\"",response:"..."},
                {type:"message",message:"\"but you’d be surprised if you knew how bad it became.\"",response:"..."},
                {type:"message",message:"\"I only ever wanted to be loved by people. I failed miserably.\"",response:"..."},
                {type:"message",message:"\"Nothing ever went my way. So I am taking matters into my own hands and I’m leaving. Please don’t look for me.\"",response:"..."},
                {type:"message",message:"\"I would say remember me by the good things, but there is nothing good about me.\"",response:"..."},
                {type:"message",message:"\"So try to forget. The last thing I want to say is I’m proud of you. You have the whole world ahead of you. \"",response:"..."},
                {type:"message",message:"\"I believe in you, Dani. Keep being strong and keep fighting for what’s right.\"",response:"..."},
                {type:"message",message:"\"-Vee\"<i> the letter ends</i>",response:"Wow. Dani I'm so sorry."},
                {type:"message",message:`<i>With her remaining strength, Dani pleads</i> \"Please... find her $NAME.\"`,response:"Where do I start?"},
                {type:"message",message:"\"Their house might be a good place to start, they spent hours cooped up in there.\"",response:"Dani, you'll see Vee again, I promise."},{id:"dani",type:"look",direction:"$",flag:"veeNote"}
                ],
                [{type:"message",message:"<i>Dani is mumbling to themself</i> \"I'm sorry, I didn't mean to hurt you Vee.\"",response:"..."},]
            ]
        }),

        },
        poi:[
        {x:5,y:5,interactEvent:[{type:"message", message:"A fully packed picnic basket...",response:"That could be useful."}],flag:{"food":true}},
        {x:6,y:5,interactEvent:[{type:"message", message:"A fully packed picnic basket...",response:"That could be useful."}],flag:{"food":true}},
        {x:2,y:2,interactEvent:[{type:"message", message:"Dani's signature plaid shirt",response:"..."}]},
        {x:5,y:3,interactEvent:[{type:"message", message:"it's probably a bit rude to rummage through Dani's things",response:"..."}]},
        {x:6,y:3,interactEvent:[{type:"message", message:"Bunk beds? I've heard Dani sleeps in either, depending on the day",response:"Today is a bottom bunk day"}]},
        {x:8,y:3,interactEvent:[{type:"message", message:"Bunk beds? I've heard Dani sleeps in either, depending on the day",response:"Today is a bottom bunk day"}]},
        {x:7,y:3,interactEvent:[{type:"message", message:"Bunk beds? I've heard Dani sleeps in either, depending on the day",response:"Today is a bottom bunk day"}]},
            {x:8,y:5,interactEvent:[{type:"message", message:"The TV is paused on Heartstopper Episode 2",response:"Good choice"}]},
            {x:8,y:6,interactEvent:[{type:"message", message:"The TV is paused on Heartstopper Episode 2",response:"Good choice"}]},
    ],
        jumpPoints:{
            [utils.asGridCoord(1,3)]:{map:"HearthTown"},
        },
    },
    veeCabin:{
        lowerMapSrc:"/images/FindingVee/maps/vee.png",
        upperMapSrc:"/images/FindingVee/maps/empty.png",
        entities:{protag : new ComplexEntity({
            x: utils.withGrid(0),
            y: utils.withGrid(3),
            startx: utils.withGrid(0),
            starty: utils.withGrid(3),
            src: '/images/FindingVee/characters/nao.png',
            height: 16,
            width: 16,
            animations: {
               "default": [[16, 0]],
               "idle-down": [[16, 0]],
               "idle-left": [[16, 16]],
               "idle-right": [[16, 32]],
               "idle-up": [[16, 48]],
               "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
               "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
               "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
               "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
            },
            isPlayer: true,
            speed:1,
        }),},
        walls:{
            [utils.asGridCoord(-1,3)]:"pre",
            [utils.asGridCoord(-1,4)]:"pre",
            [utils.asGridCoord(-1,5)]:"pre",
            [utils.asGridCoord(-1,6)]:"pre",
            [utils.asGridCoord(-1,7)]:"pre",
            [utils.asGridCoord(9,3)]:"pre",
            [utils.asGridCoord(9,4)]:"pre",
            [utils.asGridCoord(9,5)]:"pre",
            [utils.asGridCoord(9,6)]:"pre",
            [utils.asGridCoord(9,7)]:"pre",
            [utils.asGridCoord(0,8)]:"pre",
            [utils.asGridCoord(1,8)]:"pre",
            [utils.asGridCoord(2,8)]:"pre",
            [utils.asGridCoord(3,8)]:"pre",
            [utils.asGridCoord(4,8)]:"pre",
            [utils.asGridCoord(5,8)]:"pre",
            [utils.asGridCoord(6,8)]:"pre",
            [utils.asGridCoord(7,8)]:"pre",
            [utils.asGridCoord(2,2)]:"pre",
            [utils.asGridCoord(3,2)]:"pre",
            [utils.asGridCoord(4,2)]:"pre",
            [utils.asGridCoord(5,2)]:"pre",
            [utils.asGridCoord(6,2)]:"pre",
            [utils.asGridCoord(7,2)]:"pre",
            [utils.asGridCoord(8,2)]:"pre",
            [utils.asGridCoord(0,5)]:"pre",
            [utils.asGridCoord(0,6)]:"pre",
            [utils.asGridCoord(0,7)]:"pre",
            [utils.asGridCoord(1,7)]:"pre",
            [utils.asGridCoord(2,7)]:"pre",
            [utils.asGridCoord(2,6)]:"pre",
            [utils.asGridCoord(1,6)]:"pre",
            [utils.asGridCoord(6,6)]:"pre", 
            [utils.asGridCoord(6,7)]:"pre", 
            [utils.asGridCoord(7,7)]:"pre", 
            [utils.asGridCoord(7,6)]:"pre", 
            [utils.asGridCoord(8,6)]:"pre", 
            [utils.asGridCoord(8,7)]:"pre",
            [utils.asGridCoord(7,5)]:"pre",
            [utils.asGridCoord(0,2)]:"pre",
            [utils.asGridCoord(1,2)]:"pre",
        },

        poi:[
            {x:2,y:2, interactEvent:[{type:"message", message:"A little fireman monkey, his name is Niko",response:"Cute!"}]},
            {x:3,y:2, interactEvent:[{type:"message", message:"A mixed bunch of begonia flowers, the vase has an i marking.",response:"Aw, flowers!"}]},
            {x:4,y:2, interactEvent:[{type:"message", message:"An elephant named Alfonso, you can tell because of the giant A on his head",response:"Vee loves their stuffed animals..."}]},
            {x:5,y:2, interactEvent:[{type:"message", message:"A SNES, Wii, sick movie collection",response:"Was Vee... cultered?"}]},
            {x:6,y:2, interactEvent:[{id:"protag",type:"look",direction:"up"},{type:"message", message:"Behind the Wii, you notice some blemishes on the wall, where something was pinned to it by the corners and maybe in the center too?",response:"That's... odd"}],flag:{spots:true}},
            {x:7,y:2, interactEvent:[{id:"protag",type:"look",direction:"up"},{type:"message", message:"Under the TV there's an unlocked box",response:"<i>Open it</i>"},
                {type:"message",message:"<i>You open the box</i> It's a collection of maps? Some have holes in them.",response:"That's... interesting."},],flag:{maps:true}},
            {x:8,y:2, interactEvent:[{type:"message", message:"A SNES, Wii, sick movie collection",response:"Was Vee... cultered?"}]},

        ],
        jumpPoints:{
            [utils.asGridCoord(1,3)]:{map:"HearthTown"},
            [utils.asGridCoord(0,3)]:{map:"HearthTown"},
        },
    },
    tutorial:{
        lowerMapSrc:"/images/FindingVee/maps/tut.png",
        upperMapSrc:"/images/FindingVee/maps/Empty.png",
        walls:{
            [utils.asGridCoord(0,0)]:"pre",
            [utils.asGridCoord(0,1)]:"pre",
            [utils.asGridCoord(0,2)]:"pre",
            [utils.asGridCoord(0,3)]:"pre",
            [utils.asGridCoord(0,4)]:"pre",
            [utils.asGridCoord(0,5)]:"pre",
            [utils.asGridCoord(0,6)]:"pre",
            [utils.asGridCoord(0,7)]:"pre",
            [utils.asGridCoord(0,8)]:"pre",
            [utils.asGridCoord(0,9)]:"pre",
            [utils.asGridCoord(0,10)]:"pre",
            [utils.asGridCoord(0,11)]:"pre",
            [utils.asGridCoord(0,12)]:"pre",
            [utils.asGridCoord(0,13)]:"pre",
            [utils.asGridCoord(0,14)]:"pre",
            [utils.asGridCoord(0,15)]:"pre",
            [utils.asGridCoord(0,16)]:"pre",
            [utils.asGridCoord(0,17)]:"pre",
            [utils.asGridCoord(0,18)]:"pre",
            [utils.asGridCoord(0,19)]:"pre",
            [utils.asGridCoord(0,20)]:"pre",
            [utils.asGridCoord(0,21)]:"pre",
            [utils.asGridCoord(0,22)]:"pre",
            [utils.asGridCoord(0,23)]:"pre",
            [utils.asGridCoord(0,24)]:"pre",
            [utils.asGridCoord(8,0)]:"pre",
            [utils.asGridCoord(8,1)]:"pre",
            [utils.asGridCoord(8,2)]:"pre",
            [utils.asGridCoord(8,3)]:"pre",
            [utils.asGridCoord(8,4)]:"pre",
            [utils.asGridCoord(8,5)]:"pre",
            [utils.asGridCoord(8,6)]:"pre",
            [utils.asGridCoord(8,7)]:"pre",
            [utils.asGridCoord(8,8)]:"pre",
            [utils.asGridCoord(8,9)]:"pre",
            [utils.asGridCoord(8,10)]:"pre",
            [utils.asGridCoord(8,11)]:"pre",
            [utils.asGridCoord(8,12)]:"pre",
            [utils.asGridCoord(8,13)]:"pre",
            [utils.asGridCoord(8,14)]:"pre",
            [utils.asGridCoord(8,15)]:"pre",
            [utils.asGridCoord(8,16)]:"pre",
            [utils.asGridCoord(8,17)]:"pre",
            [utils.asGridCoord(8,18)]:"pre",
            [utils.asGridCoord(8,19)]:"pre",
            [utils.asGridCoord(8,20)]:"pre",
            [utils.asGridCoord(8,21)]:"pre",
            [utils.asGridCoord(8,22)]:"pre",
            [utils.asGridCoord(8,23)]:"pre",
            [utils.asGridCoord(8,24)]:"pre",
            [utils.asGridCoord(0,-1)]:"pre",
            [utils.asGridCoord(1,-1)]:"pre",
            [utils.asGridCoord(2,-1)]:"pre",
            [utils.asGridCoord(3,-1)]:"pre",
            [utils.asGridCoord(4,-1)]:"pre",
            [utils.asGridCoord(5,-1)]:"pre",
            [utils.asGridCoord(6,-1)]:"pre",
            [utils.asGridCoord(7,-1)]:"pre",
            [utils.asGridCoord(8,-1)]:"pre",
            [utils.asGridCoord(9,-1)]:"pre",
            [utils.asGridCoord(0,24)]:"pre",
            [utils.asGridCoord(1,24)]:"pre",
            [utils.asGridCoord(2,24)]:"pre",
            [utils.asGridCoord(3,24)]:"pre",
            [utils.asGridCoord(4,24)]:"pre",
            [utils.asGridCoord(5,24)]:"pre",
            [utils.asGridCoord(6,24)]:"pre",
            [utils.asGridCoord(7,24)]:"pre",
            [utils.asGridCoord(8,24)]:"pre",
            [utils.asGridCoord(9,24)]:"pre",
            [utils.asGridCoord(4,21)]:"pre",
            
        },
        entities:{protag : new ComplexEntity({
            x: utils.withGrid(5),
            y: utils.withGrid(4),
            startx: utils.withGrid(5),
            starty: utils.withGrid(4),
            src: '/images/FindingVee/characters/nao.png',
            height: 16,
            width: 16,
            animations: {
               "default": [[16, 0]],
               "idle-down": [[16, 0]],
               "idle-left": [[16, 16]],
               "idle-right": [[16, 32]],
               "idle-up": [[16, 48]],
               "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
               "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
               "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
               "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
            },
            isPlayer: true,
            speed:1,
        }),},
        poi:[
            {x:4,y:21, interactEvent:[{type:"newMap", map:"protagCabin"}]},
        ]
    },
    final:{
        lowerMapSrc:"/images/FindingVee/maps/final.png",
        upperMapSrc:"/images/FindingVee/maps/Empty.png",
        entities:{protag : new ComplexEntity({
            x: utils.withGrid(4),
            y: utils.withGrid(7),
            startx: utils.withGrid(4),
            starty: utils.withGrid(7),
            src: '/images/FindingVee/characters/nao.png',
            height: 16,
            width: 16,
            animations: {
               "default": [[16, 0]],
               "idle-down": [[16, 0]],
               "idle-left": [[16, 16]],
               "idle-right": [[16, 32]],
               "idle-up": [[16, 48]],
               "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
               "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
               "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
               "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
            },
            isPlayer: true,
            speed:1,
        }),
        vee: new ComplexEntity({
            x: utils.withGrid(4),
            y: utils.withGrid(3),
            startx: utils.withGrid(4),
            starty: utils.withGrid(3),
            src: '/images/FindingVee/characters/vee.png',
            height: 16,
            width: 16,
            animations: {
                "default": [[16, 0]],
                "idle-down": [[16, 0]],
                "idle-left": [[16, 16]],
                "idle-right": [[16, 32]],
                "idle-up": [[16, 48]],
                "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
                "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
                "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
                "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
             },
             isPlayer: true,
             speed:1,
             lines:[
                [{id:"vee",type:"look",direction:""},{type:"message",message:"\"You made it! I knew someone would.\"",response:"Vee... they were so worried about you!"},
                {type:"message",message:"\"Worried? About me?\" <i>Vee takes a moment</i> \"It doesn't matter, I left for a reason... Will you come with me?\"",response:"Where are we going?"},
                {type:"newMap",map:"fin"},]
            ],
        }),    
        },
        walls:{
            [utils.asGridCoord(2,7)]:"pre",
            [utils.asGridCoord(2,6)]:"pre",
            [utils.asGridCoord(2,5)]:"pre",
            [utils.asGridCoord(1,4)]:"pre",
            [utils.asGridCoord(1,3)]:"pre",
            [utils.asGridCoord(1,2)]:"pre",
            [utils.asGridCoord(2,2)]:"pre",
            [utils.asGridCoord(3,2)]:"pre",
            [utils.asGridCoord(4,2)]:"pre",
            [utils.asGridCoord(5,2)]:"pre",
            [utils.asGridCoord(6,2)]:"pre",
            [utils.asGridCoord(6,3)]:"pre",
            [utils.asGridCoord(6,4)]:"pre",
            [utils.asGridCoord(5,5)]:"pre",
            [utils.asGridCoord(5,6)]:"pre",
            [utils.asGridCoord(5,7)]:"pre",
        },
        poi:[],
        jumpPoints:{},
    },
    fin:{
        lowerMapSrc:"/images/FindingVee/maps/fin.png",
        upperMapSrc:"/images/FindingVee/maps/fin.png",
        entities:{protag : new ComplexEntity({
            x: utils.withGrid(4),
            y: utils.withGrid(4),
            startx: utils.withGrid(4),
            starty: utils.withGrid(4),
            src: '/images/FindingVee/characters/nao.png',
            height: 0,
            width: 0,
            animations: {
                "default": [[16, 0]],
                "idle-down": [[16, 0]],
                "idle-left": [[16, 16]],
                "idle-right": [[16, 32]],
                "idle-up": [[16, 48]],
                "down": [[0, 0], [16, 0], [32, 0], [48, 0], [64, 0]],
                "left": [[0, 16], [16, 16], [32, 16], [48, 16], [64, 16]],
                "right": [[0, 32], [16, 32], [32, 32], [48, 32], [64, 32]],
                "up": [[0, 48], [16, 48], [32, 48], [48, 48], [64, 48]],
             },
            isPlayer: false,
            speed:1,
        }),
    },
    walls:{},
    poi:[],
    jumpPoints:{},
    }
}
