class Cotnrols{
    constructor(){
        this.direction;
        this.moveKeys ={
            "ArrowUp": "up",
            "ArrowDown": "down",
            "ArrowLeft": "left",
            "ArrowRight": "right",
            "w": "up",
            "s": "down",
            "a": "left",
            "d": "right",
        }
    }

    getDirection(){
        return this.direction;
    }
    init(){
        document.addEventListener('keydown', (e) => {
            if (this.moveKeys[e.key] && this.direction == null){
                this.direction = this.moveKeys[e.key];
            }
        });
        document.addEventListener('keyup', (e) => {
            if (this.moveKeys[e.key] && this.direction == this.moveKeys[e.key]){
                this.direction = null;
            }
        });
    }
}