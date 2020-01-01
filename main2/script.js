//Canvas
let c = document.getElementById("canvas");
c.width = window.innerWidth;
c.height = window.innerHeight;
let ctx = c.getContext("2d");

let mouse = {
    x: 0,
    y: 0,
    button: [],
    isDown: false,
    old: {
        x: this.x,
        y: this.y
    },
    wheel: 0
};
document.onmousedown = e => {
    mouse.old.x = e.clientX;
    mouse.old.y = e.clientY;
    if (e.button == 0)
        mouse.isDown = true;
    mouse.button[e.button] = true;
    if (players[0].MouseDown) //Only run if it actually exists
        players[0].MouseDown();
};
document.onmouseup = e => {
    if (e.button == 0)
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
document.onwheel = e => {
    mouse.wheel += e.deltaY / 100;
    if (players[0].MouseWheel)
        players[0].MouseWheel(e.deltaY / 100);
}
document.oncontextmenu = e => {
    return false;
}
let keys = [];
document.onkeydown = e => keys[e.key] = true;
document.onkeyup = e => keys[e.key] = false;

let players = [];
class Player {
    constructor(x, y, name, width = 10, height = 10, colour = "hsl(" + (360 * Math.random()) + ",100%,50%)", isMain = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.name = name;
        this.colour = colour;
        this.isMain = isMain; //Is this you?
    }
    Update() {
        if (this.isMain) {
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
    constructor(x, y, name, width, height, colour, isMain) {
        super(x, y, name, width, height, colour, isMain);
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
    constructor(x, y, name, width, height, colour, isMain) {
        super(x, y, name, width, height, colour, isMain);
        this.gun = 2; //Current gun
        this.bullets = []; //Array containing every bullet belonging to the player
        this.lastEnemy; //Last enemy to hit you
        this.score = 0;
        this.health = 100;
        this.cooldown = 0; //How long it has been since the last bullet was fired
        this.visualTimer = 0; //Duration of visual updates
        this.visualAction = 0; //0 is Alive, 1 is Dead, 2 is Respawn Shield
        this.angle = 0; //Current view angle of the player

        this.wobble = 20; //adds wobble to the gun, and you have to focus to aim properly
        this.focus = false //Im gonna do whats called a pro gamer move
        this.velocity = {
            x: 0,
            y: 0
        } //only really used for the recoil tbh
    }
    Update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= 0.9;
        this.velocity.y *= 0.9;
        if (Math.abs(this.velocity.x) < 0.2) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < 0.2) this.velocity.y = 0;
        if (this.visualAction == 0 || this.visualAction == 2)
            super.Update();
        let wobble = Math.random() * (this.wobble) * (Math.PI / 180) - this.wobble / 2 * (Math.PI / 180);

        let angle = Math.atan2(mouse.x - this.x - c.width / 2, mouse.y - this.y - c.height / 2);
        if (this.isMain)
            this.angle = angle;
        angle += wobble;
        //gun update
        if ((mouse.button[2]) && this.isMain) {
            this.focus = true;
            if (this.wobble > 2) {
                this.wobble = this.wobble / 1.1;
            }
        } else {
            this.focus = false;
            if (this.wobble < 20) {
                this.wobble = this.wobble * 1.1;
            }
        }
        if ((mouse.isDown && mouse.button[0]) || this.cooldown > 0)
            this.cooldown++;
        if (this.gun == 0) this.cooldown %= 10;
        if (this.gun == 1) this.cooldown %= 20;
        if (this.gun == 2) this.cooldown %= 50;

        if (this.cooldown == 0 && mouse.isDown && mouse.button[0] && this.isMain) {
            //recoil
            let recoil = 0.5;
            if (this.gun == 1) recoil = 2;
            if (this.gun == 2) recoil = 4;
            this.velocity.x -= Math.sin(this.angle) * recoil;
            this.velocity.y -= Math.cos(this.angle) * recoil;

            //main bullet generation code
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
                x: this.x + Math.sin(angle) * speed, //offset it so that you cant see the bullet behind the player
                y: this.y + Math.cos(angle) * speed,
                // angle: Math.atan2(mouse.x - this.x - c.width / 2, mouse.y - this.y - c.height / 2),
                angle: angle,
                damage: damage
            }
            this.bullets.push(bullet);
        }

        //bullet update
        for (let i = 0; i < this.bullets.length; i++) {
            this.bullets[i].x += Math.sin(this.bullets[i].angle) * this.bullets[i].speed;
            this.bullets[i].y += Math.cos(this.bullets[i].angle) * this.bullets[i].speed;

            if (this.bullets[i].type == 2) {
                this.bullets[i].speed *= 1.025;
            }

            for (p in players) {
                let player = players[p];
                if (player == this) continue;
                let distX = Math.abs(this.bullets[i].x - player.x) - Math.abs(player.width);
                let distY = Math.abs(this.bullets[i].y - player.y) - Math.abs(player.height);
                let dist = Math.sqrt(distX ** 2 + distY ** 2);
                if (dist < 10 && player.visualAction == 0) {
                    player.lastEnemy = this;
                    player.health -= this.bullets[i].damage;
                    player.health = Math.max(player.health, 0);
                    if (this.bullets[i].type != 1) {
                        this.bullets.splice(i, 1);
                        i--;
                        continue;
                    }
                }
            }
        }
        if (this.health < 1 && this.visualAction == 0) {
            this.visualAction = 1;
        }
        if (this.visualAction) {
            this.visualTimer++;
        } else {
            this.visualTimer = 0;
        }
        if (this.visualAction == 1 && this.visualTimer > 120) {
            this.visualAction = 2;
            this.visualTimer = 0;
            this.x = 0;
            this.y = 0;
            this.health = 100;
        }
        if (this.visualAction == 2 && this.visualTimer > 360) {
            this.visualAction = 0;
            this.visualTimer = 0;
        }
    }
    Draw() {
        //Health bar, cuz we need to see how much health you have, you know?
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 50 + c.width / 2, this.y - 20 + c.height / 2, 100, 10);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x - 50 + c.width / 2, this.y - 20 + c.height / 2, this.health, 10);
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x - 50 + c.width / 2, this.y - 20 + c.height / 2, 100, 10);

        //Draw Bullets
        ctx.strokeStyle = "black";
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

        //draw aim lines
        if (this.isMain) {
            let wAngle = (this.wobble * 2) * (Math.PI / 180);
            let a1x = Math.sin(this.angle - wAngle);
            let a1y = Math.cos(this.angle - wAngle);
            let a2x = Math.sin(this.angle + wAngle);
            let a2y = Math.cos(this.angle + wAngle);
            let aimGradient1 = ctx.createRadialGradient(this.x + c.width / 2, this.y + c.height / 2, 10, this.x + c.width / 2, this.y + c.height / 2, 100);
            aimGradient1.addColorStop(0, "rgba(255,0,0,0)");
            aimGradient1.addColorStop(1, "rgba(255,0,0," + (1 - this.wobble / 20) + ")");

            ctx.strokeStyle = aimGradient1;
            ctx.beginPath();
            ctx.moveTo(this.x + a1x * 20 + c.width / 2, this.y + a1y * 20 + c.height / 2);
            ctx.lineTo(this.x + a1x * 100 + c.width / 2, this.y + a1y * 100 + c.height / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + a2x * 20 + c.width / 2, this.y + a2y * 20 + c.height / 2);
            ctx.lineTo(this.x + a2x * 100 + c.width / 2, this.y + a2y * 100 + c.height / 2);
            ctx.stroke();
        }

        //Visual stuff like the player explosion or respawn shield
        if (this.visualAction != 1)
            super.Draw();

        if (this.isMain) {
            ctx.font = "30px Arial"
            //Draw text
            if (this.gun == 0) ctx.fillText("Pistol", 10, 40);
            if (this.gun == 1) ctx.fillText("Sniper Rifle", 10, 40);
            if (this.gun == 2) ctx.fillText("Rocket Launcher", 10, 40);
            ctx.fillText("Score: " + this.score, 10, 90);

            ctx.font = "10px Arial";
        }

        if (this.visualAction == 1) {
            ctx.beginPath();
            ctx.moveTo(this.x + (Math.random() * (20 - Math.sqrt(this.visualTimer * 2)) + (20 - Math.sqrt(this.visualTimer * 2))) + c.width / 2, this.y + c.height / 2);
            for (let a = 1; a < 15; a++) {
                let amplitude = Math.random() * (20 - Math.sqrt(this.visualTimer * 2)) + (20 - Math.sqrt(this.visualTimer * 2));
                let angle = a * (Math.PI / 7.5);
                ctx.lineTo(this.x + Math.cos(angle) * amplitude + c.width / 2, this.y + Math.sin(angle) * amplitude + c.height / 2);
            }
            ctx.fillStyle = "hsl(" + Math.sqrt(this.visualTimer * 4) + ",100%,50%)";
            ctx.fill();
        }
        if (this.visualAction == 2) {
            ctx.beginPath();
            ctx.arc(this.x + c.width / 2, this.y + c.height / 2, 15, 0, 2 * Math.PI);
            ctx.fillStyle = "hsla(" + (Math.sin(this.visualTimer * (Math.PI / 45)) * 20 + 220) + ", 100%,50%, 0.5)";
            ctx.fill();
        }


    }
    MouseWheel(delta) {
        let diff = Math.round(delta);
        this.gun += diff;
        this.gun %= 3;
        while (this.gun < 0) this.gun += 3;
    }
}
players[0] = new GunPlayer(0, 0, "bruh", 10, 10);
players[0].isMain = true;
players[1] = new GunPlayer(0, 0, "beeeeee", 10, 10);
//Main Loop
function Loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (p in players) {
        let player = players[p];
        player.Update();
        player.Draw();
    }

    requestAnimationFrame(Loop);
}
Loop();