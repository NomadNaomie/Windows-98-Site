class Event{
    constructor({map,event}){
        this.map = map;
        this.event = event;
    
    }
    idle(resolve){
        let entity = this.map.entities[this.event.id];
        entity.startBehaviour({map:this.map},{
            type:"idle",
            time:this.event.time,
        });
        const handler = e => {
            if (e.detail.id == this.event.id){
                document.removeEventListener("idleEnd",handler);
                resolve();
            }
        }
        document.addEventListener("idleEnd",handler);

    }
    look(resolve){
        let entity = this.map.entities[this.event.id];
        entity.spriteMap.animationIndex = 0;
        entity.spriteMap.animation = "idle-"+this.event.direction;
        entity.direction = this.event.direction;
        resolve();
    }
    move(resolve){

        let entity = this.map.entities[this.event.id];
        entity.startBehaviour({map:this.map},{
            type:"move",
            direction: this.event.direction,
            retry:true,
        })
        const handler = e => {
            if (e.detail.id == this.event.id){
                document.removeEventListener("moveEnd",handler);
                resolve();
            }
        }
        document.addEventListener("moveEnd",handler);
    }
    message(resolve){

        let message = new Message({message:this.event.message,response:this.event.response,callback: () => resolve()});
        message.init(document.getElementById("game"));
    }
    newMap(resolve){
        let fade = new Fade();
        fade.init(document.getElementById("game"),()=>{
            this.map.world.newMap(window.Maps[this.event.map]);
            resolve();
            fade.fadeOut();
        });
        
    }
    execute(){
        return new Promise((resolve,reject) => {this[this.event.type](resolve)})
    }
}