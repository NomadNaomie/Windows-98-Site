class Entity{
    constructor(config){
        this.x = config.x;
        this.loaded = false;
        this.y = config.y;
        this.startx = config.startx;
        this.starty = config.starty;
        this.direction = config.direction || 'down';
        this.spriteMap = new SpriteMap({
            entity: this,
            src: config.src,
            animations: config.animations || {
                default: [[0,0]]
            },
        });
        this.height = config.height;
        this.width = config.width;
        this.agenda = config.agenda || [];
        this.agendaIndex = 0;
        this.lines = config.lines || [];
    }
    load(map){
        this.loaded = true;
        this.x = this.startx;
        this.y = this.starty;
        for (let wall in map.walls) {
            if (map.walls[wall] == this.id) {
                delete map.walls[wall];
            }
        }
        this.agendaIndex = 0;
        map.addWall(this.x,this.y,this.id);

        setTimeout(() => {
            this.executeAgenda(map);
        },20);
    }
    update(){
    }
    async executeAgenda(map){

        if (!map.ready || this.agenda.length == 0 || this.idling || map.dead)return;

        
        let event = this.agenda[this.agendaIndex];
        event.id = this.id;

        const handler = new Event({map,event:event});
        await handler.execute();

        this.agendaIndex == this.agenda.length - 1 ? this.agendaIndex = 0 : this.agendaIndex++;
        this.executeAgenda(map);
    }
}