class Message{
    constructor({message,response,callback}){
        this.message = message.replace("$NAME",window.CharName);
        this.callback = callback;
        this.element = null;
        this.response = response;
    }
    create(){
        this.element = document.createElement("div");
        this.element.classList.add("Message");
        this.element.innerHTML = `<p>${this.message}</p><button>${this.response}</button>`;
        this.element.querySelector("button").addEventListener("click",()=>{
            this.destroy();
        })
        this.keyListener = new InteractListener("Enter",()=>{
            this.destroy();
        });
        this.secondKeyListener = new InteractListener(" ",()=>{
            this.destroy();
        });
    }
    destroy(){
        this.secondKeyListener.destroy();
        this.keyListener.destroy();
        this.element.remove();
        this.callback();
    }
    init(container){
        this.create();
        container.appendChild(this.element);
    }
}