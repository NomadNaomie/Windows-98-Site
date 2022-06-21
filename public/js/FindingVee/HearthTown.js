class HearthTown {
    constructor(config) {
        this.element = config.element;
        this.canvas = this.element.querySelector('.game-canvas');
        this.context = this.canvas.getContext('2d');
        this.context.imageSmoothingEnabled = false;
        this.context.webkitImageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.flags = {}
        this.map = null;
        this.charName = window.CharName;
        this.fade = new Fade();
        this.flag = false;
    }
    fadeMusic(){
        let music = document.getElementById("music");
        this.track = music.src;
        this.trackTime = music.currentTime;
        while (music.volume > 0.01){
            
            music.volume -= 0.01;
            setTimeout(()=>{},400);
        }
        music.volume = 0;
        return;
    }
    newMap(mapName) {
        this.map = new Map(mapName);
        this.map.world = this;
        this.map.CharName = this.charName;
        if (!this.flag && mapName.lowerMapSrc == "/images/FindingVee/maps/protag.png"){
            let music = document.getElementById("music");
            music.volume = 0.25;
            music.play();
            this.flag = true;
            this.map.entities.protag.startx = utils.withGrid(6);
            this.map.entities.protag.starty = utils.withGrid(3);
            let zeph = new ComplexEntity({
                x: utils.withGrid(4),
                y: utils.withGrid(3),
                startx: utils.withGrid(4),
                starty: utils.withGrid(3),
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
            })
            this.map.entities.zeph = zeph;
            this.map.loadEntities();
            this.fade.fadeOut();
            this.map.cutscene([                    {id:"zeph",type:"move",direction:"right"},
            {type:"message",message:`$NAME wake up! Vee's gone, we need help looking for them!`,response:"..."},
            {id:"zeph",type:"move",direction:"left"},
            {id:"zeph",type:"look",direction:"right"},
            {id:"protag",type:"move",direction:"left"},
            {type:"message",message:"What do you mean he's gone?",response:"..."},
            {type:"message",message:"She left Dani a note and just... left. Go find Dani, they can tell you more",response:"Of course"},
            {id:"zeph",type:"move",direction:"left"},
            {id:"zeph",type:"move",direction:"left"},
            {id:"zeph",type:"move",direction:"left"},
            {id:"zeph",type:"move",direction:"left"},
            {id:"zeph",type:"look",direction:"up"},
            {id:"zeph",type:"idle",time:300},
            {id:"zeph",type:"look",direction:"up",flag:"zeph-cut"},
        ])
        return;
        }
        this.map.loadEntities();
        this.fade.fadeOut();
        this.trackTime = document.getElementById("music").currentTime;
        if (!this.flags.zeph && mapName.lowerMapSrc == "/images/FindingVee/maps/zeph.png"){
            this.flags.zeph = true;
            this.map.cutscene([
                {type:"message",message:"Hang on, Zeph owns a foxing ice cream bar??",response:"Where the hell has this been all this time?"},
            ]);
        }
        if (this.flags.hasMap && !this.flags.food && mapName.lowerMapSrc == "/images/FindingVee/maps/zeph.png"){
            this.map.cutscene([
                {type:"message",message:"I don't think the ice crea will make it the whole way to Vee.",response:"I'll have to find something else"},
            ]);
        }
        let music = document.getElementById("music");
        if (this.flags.veeNote && this.flags.hasMap){
            music.volume = 0.25;
            if (music.src != "/sounds/FindingVee/eastrocks.ogg"){
                music.src = "/sounds/FindingVee/eastrocks.ogg";
            }
        }
        if (this.flags.veeNote && !this.flags.hasMap){
            music.volume = 0.25;
            if (music.src != "/sounds/FindingVee/winds.ogg"){
                music.src = "/winds.ogg";
            }
        }
        if (!this.flags.veeNote){
            music.volume = 0.25;
            if (music.src != "/sounds/FindingVee/snowfall.ogg"){
                music.src = "/sounds/FindingVee/snowfall.ogg";
            }
        }
        if (!music.src == this.track){
            music.currentTime = 0.0;
            music.play();
            this.track = music.src;
        }else{
            music.currentTime = this.trackTime;
            music.play();
        }
    }
    init() {
        this.fade.init(document.getElementById("game"),()=>{
            this.newMap(window.Maps.tutorial)
            this.control = new Cotnrols();
            this.control.init();
            var fps = 30;
            this.frameDuration = 1000 / fps;
            this.lag = 0;
            this.previous = 0;
            this.startTime = 0;
            this.start();
            this.interactionChecker();
            this.moveChecker();
            let music = document.getElementById("music");
            music.volume = 0.25;
            music.loop = true;
            music.play();
            this.track = music.src;

        });
    }
    moveChecker(){
        document.addEventListener("moveEnd",e=>{
            if (e.detail.id == "protag"){
                this.map.checkMove();
            }
        });
    }
    interactionChecker(){
        let a = new InteractListener("Enter",()=>{
            if (this.map.ready){
            this.map.interact();
            this.map.checkInteract();}
        });
        let b = new InteractListener(" ",()=>{
            if (this.map.ready){
                this.map.interact();
                this.map.checkInteract();}
        });
    }
    start() {
        const gameLoop = () => {
            requestAnimationFrame(gameLoop);
            this.now = window.performance.now();
            let delta = this.now - this.previous;
            if (delta > 1000) {
                delta = this.frameDuration;
            }
            this.lag += delta;
            if (this.lag >= this.frameDuration) {
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                Object.keys(this.map.entities).forEach(key => {
                    let entity = this.map.entities[key];
                    if (entity){
                        entity.update({
                            direction: this.control.getDirection(),
                            map: this.map,
                        });
                    }
                });
                this.map.drawLower(this.context, this.map.entities.protag);
                Object.keys(this.map.entities).sort((a,b)=>{return a.y - b.y;}).forEach(key => {
                    let entity = this.map.entities[key];
                    if (entity){entity.spriteMap.draw(this.context, this.map.entities.protag);}
                });


                this.map.drawUpper(this.context, this.map.entities[0]);
                this.lag -= this.frameDuration;
            }
            this.previous = this.now;
        }
        gameLoop();
    }
}
