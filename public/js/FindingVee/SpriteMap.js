class SpriteMap{
    constructor(config){
        this.entity = config.entity;
        this.animations = config.animations
        this.animation = config.animation || 'default';
        this.animationIndex = 0;
        this.frameLimit = 4;
        this.frameCount = 4;
        this.image = new Image();
        this.image.onload = () => {
            this.ready = true;
        }
        this.image.src = config.src;
        this.hasShadow = config.hasShadow || false;
        if (this.hasShadow){
            this.shadow = new Image();
            this.shadow.src = config.shadowSrc || '/images/FindingVee/characters/shadow.png';
            this.shadow.onload = () => {
                this.shadowReady = true;
            }
        }
    }
    update(){
        if (this.frameCount > 0){this.frameCount--;return;}
        this.frameCount = this.frameLimit;
        if (this.animationIndex < this.animations[this.animation].length - 1)this.animationIndex++;
        else this.animationIndex = 0;
    }
    draw(context, camera){
        let x = this.entity.x + utils.withGrid(6.5) - camera.x;
        let y = this.entity.y + utils.withGrid(5) - camera.y;
        this.shadowReady && context.drawImage(this.shadow, x, y);
        if (this.animations[this.animation][this.animationIndex] === undefined){this.animationIndex = 0;}
        this.ready && context.drawImage(
                this.image,
                this.animations[this.animation][this.animationIndex][0],
                this.animations[this.animation][this.animationIndex][1],
                this.entity.width,this.entity.height,
                x,y,
                this.entity.width,this.entity.height
        );
        
        this.update();
    }
}
