//Canvas
let c = document.getElementById("canvas");
c.width = window.innerWidth;
c.height = window.innerHeight * 0.95;
let ctx = c.getContext("2d");

let mouse = {
    x: 0,
    y: 0,
    button: [],
    isDown: false,
    old: {
        x: this.x,
        y: this.y
    }
};
document.onmousedown = e => {
    mouse.old.x = e.clientX;
    mouse.old.y = e.clientY;
    mouse.isDown = true;
    mouse.button[e.button] = true;
    if (players[0].MouseDown) //Only run if it actually exists
        players[0].MouseDown();
};
document.onmouseup = e => {
    mouse.isDown = false;
    mouse.button[e.button] = false;
    if (players[0].MouseUp)
        players[0].MouseUp();
};
document.onmousemove = e => {
    mouse.x = e.clientX - c.getBoundingClientRect().left;
    mouse.y = e.clientY - c.getBoundingClientRect().top;
    if (players[0].MouseMove)
        players[0].MouseMove();
};

let keys = [];
document.onkeydown = e => keys[e.key] = true;
document.onkeyup = e => keys[e.key] = false;

let players = [];
class Player {
    constructor(x, y, name, width = 10, height = 10, colour = "hsl(" + (360 * Math.random()) + ",100%,50%)") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.name = name;
        this.colour = colour;
    }
    Update() {
        if (keys["w"] || keys["ArrowUp"]) {
            this.y--;
        }
        if (keys["a"] || keys["ArrowLeft"]) {
            this.x--;
        }
        if (keys["s"] || keys["ArrowDown"]) {
            this.y++;
        }
        if (keys["d"] || keys["ArrowRight"]) {
            this.x++;
        }
    }
    Draw() {
        ctx.fillStyle = this.colour;
        ctx.fillRect(this.x - this.width / 2 + c.width / 2, this.y - this.height / 2 + c.height / 2, this.width, this.height);

        ctx.fillStyle = "black";
        let nameWidth = ctx.measureText(this.name).width;
        ctx.fillText(this.name, this.x - nameWidth / 2 + c.width / 2, this.y + this.height / 2 + c.height / 2 + 10);
    }
}
class MainPlayer extends Player {
    constructor(x, y, name, width, height, colour) {
        super(x, y, name, width, height, colour);
        this.shapes = []; //Array containing shapes. The first index is the colour and thickness of the shape
        this.shape = 0; //Current shape
        this.shapecolour = "black"; //The colour of the shape
        this.thickness = 1; //The thickness of the shape's lines
    }
    Update() {
        super.Update();
        this.DrawShapes();
    }
    DrawShapes() {
        for (let shape = 0; shape < this.shapes.length; shape++) {
            ctx.strokeStyle = this.shapes[shape][0].x;
            ctx.lineWidth = this.shapes[shape][0].y;
            ctx.beginPath();
            for (let i = 1; i < this.shapes[shape].length; i++) {
                if (i == 1) ctx.moveTo(this.shapes[shape][i].x + c.width / 2, this.shapes[shape][i].y + c.height / 2);
                else ctx.lineTo(this.shapes[shape][i].x + c.width / 2, this.shapes[shape][i].y + c.height / 2);
            }
            ctx.stroke();
        }
    }
    MouseDown() {
        this.shapes[this.shape] = [];
        this.shapes[this.shape][0] = {
            x: this.shapecolour,
            y: this.thickness
        }
        this.shapes[this.shape][1] = {
            x: mouse.x - c.width / 2,
            y: mouse.y - c.height / 2
        }
    }
    MouseMove() {
        if (mouse.isDown)
            this.shapes[this.shape].push({
                x: mouse.x - c.width / 2,
                y: mouse.y - c.height / 2
            });
    }
    MouseUp() {
        this.shape++;
    }

}
class GunPlayer extends Player {
    constructor(x, y, name, width, height, colour) {
        super(x, y, name, width, height, colour);
        this.gun = 2; //Current gun
        this.bullets = []; //Array containing every bullet belonging to the player
        this.lastEnemy; //Last enemy to hit you
        this.score = 0;
        this.cooldown = 0; //How long it has been since the last bullet was fired
        this.visualTimer = 0; //Duration of visual updates
        this.visualAction = 0; //0 is Alive, 1 is Dead, 2 is Respawn Shield
        this.angle = 0; //Current view angle of the player
    }
    Update() {
        super.Update();
        let angle = Math.atan2(mouse.x - this.x - c.width / 2, mouse.y - this.y - c.height / 2);
        this.angle = angle;

        //gun update
        if (mouse.isDown || this.bulletTimer > 0)
            this.cooldown++;
        if (this.gun == 0) this.cooldown %= 10;
        if (this.gun == 1) this.cooldown %= 20;
        if (this.gun == 2) this.cooldown %= 50;

        if (this.cooldown == 0 && mouse.isDown) {
            let speed = 0;
            let damage = 20;
            if (this.gun == 0) speed = 15;
            else if (this.gun == 1) speed = 20;
            else if (this.gun == 2) speed = 5;
            if (this.gun == 1) damage = 50;
            else if (this.gun == 2) damage = 100;
            let bullet = {
                type: this.gun,
                speed: speed,
                x: this.x,
                y: this.y,
                // angle: Math.atan2(mouse.x - this.x - c.width / 2, mouse.y - this.y - c.height / 2),
                angle: this.angle,
                damage: damage,
                spinDirection: Math.round(Math.random()) * 2 - 1, //just a cool effect for the rocket launcher
                time: 0,
                duration: Math.random() * 30 + 15
            }
            this.bullets.push(bullet);
        }

        //bullet update
        for (let i = 0; i < this.bullets.length; i++) {
            this.bullets[i].x += Math.sin(this.bullets[i].angle) * this.bullets[i].speed;
            this.bullets[i].y += Math.cos(this.bullets[i].angle) * this.bullets[i].speed;

            if (this.bullets[i].type == 2) {
                this.bullets[i].time++;
                if (this.bullets[i].time < this.bullets[i].duration) {
                    this.bullets[i].speed *= 1.025;
                    this.bullets[i].angle += Math.sin(this.bullets[i].time / 3) / 20;
                } else {
                    this.bullets[i].speed /= 1.025;
                    this.bullets[i].angle += this.bullets[i].spinDirection * (this.bullets[i].time - this.bullets[i].duration) / 100;
                }
                if (this.bullets[i].time > this.bullets[i].duration + (150 - 35)) {
                    this.bullets.splice(i, 1);
                    i--;
                    continue;
                }
            }

            for (player of players) {
                if (player == this) continue;
                let distX = Math.abs(this.bullets[i].x - player.x) - Math.abs(player.width);
                let distY = Math.abs(this.bullets[i].y - player.y) - Math.abs(player.height);
                let dist = Math.sqrt(distX ** 2 + distY ** 2);
                if (dist < 10) {
                    player.lastEnemy = this;
                    player.health -= this.bullets[i].damage;
                }
            }
        }
    }
    Draw() {
        //Draw Bullets
        for (let i = 0; i < this.bullets.length; i++) {
            let thickness = Math.min(7 - this.bullets[i].speed / 5, 10);
            let length = Math.max(this.bullets[i].speed / 2 + 10, 10);
            let vector = {
                x: Math.sin(this.bullets[i].angle), //used to make some sort of bleh
                y: Math.cos(this.bullets[i].angle)
            }
            ctx.lineWidth = thickness;
            ctx.beginPath();
            ctx.moveTo(this.bullets[i].x - (vector.x * length) + c.width / 2, this.bullets[i].y - (vector.y * length) + c.height / 2);
            ctx.lineTo(this.bullets[i].x + c.width / 2, this.bullets[i].y + c.height / 2);
            ctx.stroke();
            ctx.lineWidth = 1;
        }

        //Draw gun
        let x = Math.sin(this.angle);
        let y = Math.cos(this.angle);
        let thickness = 3;
        let length = 30;
        if (this.gun == 2) thickness = 5;
        if (this.gun == 0) length = 15;
        if (this.gun == 3) length = 30;
        ctx.lineWidth = thickness;
        ctx.strokeStyle = "#7F7F7F";
        ctx.beginPath();
        ctx.moveTo(this.x + c.width / 2, this.y + c.height / 2);
        ctx.lineTo(this.x + x * length + c.width / 2, this.y + y * length + c.height / 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000";

        super.Draw();
    }
}
players[0] = new GunPlayer(0, 0, "bruh", 10, 10);
//Main Loop
function Loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (player of players) {
        player.Update();
        player.Draw();
    }

    requestAnimationFrame(Loop);
}
Loop();