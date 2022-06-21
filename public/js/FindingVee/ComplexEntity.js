class ComplexEntity extends Entity{
    constructor(config){
        super(config);
        this.moveDistance = 0;
        this.idling = false;
        this.speed = config.speed || 1;
        this.isPlayer = config.isPlayer || false;

    }
    startBehaviour(update,behaviour){
            if (behaviour.type == "move"){
                this.direction = behaviour.direction;
            if (update.map.isSpaceTaken(this.x,this.y,behaviour.direction) ){
                if (this.isPlayer)update.map.interact();
                behaviour.retry && setTimeout(() => {
                        this.startBehaviour(update,behaviour);
                    },10);
                return
            }else{
                update.map.moveWall(this.x,this.y,behaviour.direction,this.id);
                this.moveDistance = 16;
                this.updateSprite();
            }
            
        }
        if (behaviour.type == "idle"){
            this.idling = true;
            setTimeout(()=>{
                let e = new CustomEvent("idleEnd",{detail:{id:this.id}});
                document.dispatchEvent(e);
                this.idling = false;
            },behaviour.time);
        }

    }
    update(update){
        if (this.moveDistance > 0){
            this.updatePos();
        }else{
            if (this.isPlayer && update.direction && update.map.ready){
                this.startBehaviour(update,{
                    type:"move",
                    direction: update.direction,
                })
            }
            this.updateSprite();
        }
    }
    updatePos(){
        this.direction == "right" ? this.x += this.speed : this.direction == "left" ? this.x -= this.speed : this.direction == "up" ? this.y -= this.speed : this.direction == "down" ? this.y += this.speed : null;
        this.moveDistance -= this.speed;
        if (this.moveDistance == 0){
            const event = new CustomEvent("moveEnd",{detail:{id:this.id}});
            document.dispatchEvent(event);
        }
    }
    updateSprite(){
        
        if (this.moveDistance > 0){
            this.spriteMap.animation = this.direction;
            return;
        }else{
            this.spriteMap.animation = "idle-" + this.direction;
        }
    }
}
