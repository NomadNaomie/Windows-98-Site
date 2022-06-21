class Fade{
    constructor(){
        this.element;
    }
    create(){
        this.element = document.createElement("div");
        this.element.classList.add("fade");
    }
    fadeOut(){
        this.element.classList.add("out");
        this.element.addEventListener("animationend",()=>{
            this.element.remove();
        },{once:true});
    }
    init(container,callback){
        this.create();
        container.appendChild(this.element);
        this.element.addEventListener("animationend",()=>{
            callback();
        },{once:true});
    }
}