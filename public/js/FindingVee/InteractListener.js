class InteractListener {
    constructor(key, callback) {
        this.flag = true;
        this.callback = callback;
        this.keydown = e => {
            if (e.key == key) {
                this.flag = true;
                callback();
            }
        }
        this.keyup = e => {
            if (e.key == key) {
                this.flag = false;
            }
        }
        document.addEventListener("keydown", this.keydown);
        document.addEventListener("keyup", this.keyup);
    }
    destroy() {
        document.removeEventListener("keydown", this.keydown);
        document.removeEventListener("keyup", this.keyup);
    }
}