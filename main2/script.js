//Canvas
let c = document.getElementById("canvas");
c.width = window.innerWidth;
c.height = window.innerHeight;
let ctx = c.getContext("2d");

let socket = io();
let id = socket.id;
let room = "gun"

function GeneratePlayer() {
    switch (room) {
        case "main":
            return new MainPlayer(0, 0, "Choosing a name", 10, 10, null, false);
        case "gun":
            return new GunPlayer(0, 0, "Choosing a name", 10, 10, null, false);
    }
}

function copyObject(object) {
    let ob = new Object();
    for (i in object) {
        ob[i] = object[i];
    }
    return ob;
}

function sameObject(ob1, ob2) {
    for (i in ob1) { //Go through ob1
        if (ob2[i] != ob1[i]) return false;
    }
    for (i in ob2) { //Go through ob2
        if (ob2[i] != ob1[i]) return false;
    }
    return true;
}

socket.on("PlayerJoined", id => {
    players[id] = GeneratePlayer();
})
socket.on("PlayerLeave", id => {
    delete players[id];
})
socket.on("SetPosition", (id, position) => {
    players[id].x = position.x;
    players[id].y = position.y;
})
socket.on("KeyChange", (id, mov, position) => {
    players[id].mov = copyObject(mov);
    players[id].x = position.x;
    players[id].y = position.y;
})
socket.on("SetColour", (id, colour) => {
    players[id].colour = colour;
})
socket.on("SetName", (id, name) => {
    players[id].name = name;
})
socket.on("MouseDown", (id, position, wobble) => {
    if (players[id].MouseDown)
        players[id].MouseDown(position, wobble);
})
socket.on("MouseMove", (id, position) => {
    if (players[id].MouseMove)
        players[id].MouseMove(position);
})
socket.on("MouseUp", (id) => {
    if (players[id].MouseUp)
        players[id].MouseUp();
})
socket.on("ShootGun", (id, wobble) => {
    players[id].ShootGun(wobble);
})
socket.on("MouseWheel", (id, delta) => {
    if (players[id].MouseWheel)
        players[id].MouseWheel(delta);
})
socket.on("UndoShape", (id) => { //will only ever happen in main room (for now)
    players[id].UndoShape();
})
socket.on("message", (id, message) => {
    if (id == socket.id) id = 0;
    messages.push(players[id].name + ": " + message);
})
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
    if (!(mouse.x + c.width / 2 > textbox.x && mouse.x + c.width / 2 < textbox.x + textbox.width && mouse.y + c.height / 2 > textbox.y && mouse.y + c.height / 2 < textbox.y + textbox.height && textbox.isFocused) || !textbox.isFocused) {
        if (players[0].MouseDown) //Only run if it actually exists
            players[0].MouseDown(mouse);
        socket.emit("MouseDown", mouse);
        textbox.isFocused = false;
    }

};
document.onmouseup = e => {
    if (e.button == 0)
        mouse.isDown = false;
    mouse.button[e.button] = false;
    if (players[0].MouseUp)
        players[0].MouseUp();
    socket.emit("MouseUp");
};
document.onmousemove = e => {
    mouse.x = e.clientX - c.getBoundingClientRect().left - c.width / 2;
    mouse.y = e.clientY - c.getBoundingClientRect().top - c.height / 2;
    if (players[0].MouseMove)
        players[0].MouseMove(mouse);
    socket.emit("MouseMove", mouse);
};
document.onwheel = e => {
    mouse.wheel += e.deltaY / 100;
    if (players[0].MouseWheel)
        players[0].MouseWheel(e.deltaY / 100);
    socket.emit("MouseWheel", e.deltaY / 100);
}
document.oncontextmenu = e => {
    return false;
}

let keys = [];
document.onkeydown = e => {
    if (textbox.isFocused && ((e.keyCode > 46 && e.keyCode < 91) || e.keyCode == 32 || (e.keyCode > 105 && e.keyCode < 112) || (e.keyCode > 145))) {
        textbox.text = textbox.text.slice(0, textbox.cursor) + e.key + textbox.text.slice(textbox.cursor, textbox.text.length);
        textbox.cursor++;
    }
    if (e.key == "Backspace" && textbox.cursor > 0) {
        textbox.text = textbox.text.slice(0, textbox.cursor - 1) + textbox.text.slice(textbox.cursor, textbox.text.length);
        textbox.cursor--;
        textbox.cursor = Math.max(textbox.cursor, 0);
    }
    if (e.key == "Delete" && textbox.cursor < textbox.text.length) {
        textbox.text = textbox.text.slice(0, textbox.cursor) + textbox.text.slice(textbox.cursor + 1, textbox.text.length);
    }
    if (e.key == "ArrowLeft") {
        textbox.cursor--;
        textbox.cursor = Math.max(textbox.cursor, 0);
    }
    if (e.key == "ArrowRight") {
        textbox.cursor++;
        textbox.cursor = Math.min(textbox.cursor, textbox.text.length);
    }
    keys[e.key] = true;
};
document.onkeyup = e => {
    keys[e.key] = false;
};

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
        this.mov = {
            x: 0,
            y: 0
        }
    }
    Update() {

        this.x += this.mov.x;
        this.y += this.mov.y;

    }
    Draw() {
        //you
        ctx.fillStyle = this.colour;
        ctx.fillRect(this.x - this.width / 2 + c.width / 2, this.y - this.height / 2 + c.height / 2, this.width, this.height);

        //your name
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
        this.paint = "black"; //The colour of the shape
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
    MouseDown(position = {
        x: mouse.x,
        y: mouse.y
    }) {
        this.shapes[this.shape] = [];
        this.shapes[this.shape][0] = {
            x: this.paint,
            y: this.thickness
        }
        this.shapes[this.shape][1] = {
            x: position.x,
            y: position.y
        }
    }
    MouseMove(position = {
        x: mouse.x,
        y: mouse.y
    }) {
        if (this.shapes[this.shape]) {

            this.shapes[this.shape].push({
                x: position.x,
                y: position.y
            })
        }
    }
    MouseUp() {
        this.shape++;
    }
    MouseWheel(delta) {
        this.thickness = Math.max(this.thickness + delta, 1);
    }
    UndoShape() {
        this.shapes.splice(this.shape, 1);
        this.shape = Math.max(this.shape - 1, 0);
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
        this.mouseIsDown = false;
        this.rightMouseIsDown = false;
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


        //bullet update
        for (let i = 0; i < this.bullets.length; i++) {
            this.bullets[i].x += Math.sin(this.bullets[i].angle) * this.bullets[i].speed;
            this.bullets[i].y += Math.cos(this.bullets[i].angle) * this.bullets[i].speed;

            if (this.bullets[i].type == 2) {
                this.bullets[i].speed *= 1.025;
            }
            if (Math.sqrt(this.bullets[i].x ** 2 + this.bullets[i].y ** 2) > 1500) {
                this.bullets.splice(i, 1);
                i--;
                continue;
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
            this.lastEnemy.score += 20;
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
        ctx.fillRect(this.x - 75 / 2 + c.width / 2, this.y - 20 + c.height / 2, 75, 7);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x - 75 / 2 + c.width / 2, this.y - 20 + c.height / 2, this.health / (1 / 3 + 1), 7);
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x - 75 / 2 + c.width / 2, this.y - 20 + c.height / 2, 75, 7);

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
    MouseDown(mouse) {
        if (mouse.isDown)
            this.mouseIsDown = true;
        if (mouse.button[2])
            this.rightMouseIsDown = true;
    }
    MouseMove(pos) {
        this.angle = Math.atan2(pos.x - this.x, pos.y - this.y);
    }
    MouseUp() {
        this.mouseIsDown = false;
    }
    MouseWheel(delta) {
        let diff = Math.round(delta);
        this.gun += diff;
        this.gun %= 3;
        while (this.gun < 0) this.gun += 3;
    }
    ShootGun(wobb) {
        let angle = this.angle;
        angle += wobb;
        //gun update
        if (this.isMain) {
            if ((mouse.button[2])) {
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
        }



        if (this.cooldown == 0 && this.mouseIsDown) {
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
            if (this.isMain) {
                socket.emit("ShootGun", wobb);
            }
        }
        if (this.isMain) {
            if (this.mouseIsDown || this.cooldown > 0)
                this.cooldown++;
            if (this.gun == 0) this.cooldown %= 10;
            if (this.gun == 1) this.cooldown %= 20;
            if (this.gun == 2) this.cooldown %= 50;
        }
    }
}
let messages = [];
let textbox = {
    x: 0,
    y: c.height - 50,
    width: c.width,
    height: 50,
    cursor: 0,
    text: "ur mother is ur father",
    blinktimer: 0,
    blinkspeed: 50, //first half is visible, second half is invisible
    draw: function () {
        if (this.visibility > 0) {
            //the box itself
            ctx.fillStyle = "rgba(255,255,255," + this.visibility + ")";
            ctx.strokeStyle = "rgba(0,0,0," + this.visibility + ")";
            ctx.lineWidth = 2;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            //the text
            ctx.font = "20px Arial";
            ctx.fillStyle = "rgba(0,0,0," + this.visibility + ")";
            ctx.fillText(this.text, this.x + 10, this.y + 32, this.width - 10);


            //the cursor
            ctx.lineWidth = 1;
            if (this.blinktimer < this.blinkspeed / 2) {

                let cursorX = ctx.measureText(this.text.slice(0, this.cursor)).width; //calculate cursor position
                let overflow = ctx.measureText(this.text).width / (this.width - 10);
                if (overflow > 1) {
                    cursorX /= overflow;
                }
                ctx.beginPath();
                ctx.moveTo(Math.round(this.x + 10 + cursorX), Math.round(this.y + 10));
                ctx.lineTo(Math.round(this.x + 10 + cursorX), Math.round(this.y + 40));
                ctx.stroke();
            }
            ctx.font = "10px Arial";
        }

    },
    update: function () {
        this.blinktimer++;
        this.blinktimer %= this.blinkspeed;
        if (!this.isFocused) this.visibility -= 0.05;
        else this.visibility = 1;
    },
    isFocused: true,
    visibility: 1
}
let messageBoxScroll = 0;
let messageBoxFade = 0;


players[0] = GeneratePlayer();
players[0].name = prompt("What is your name?");
players[0].colour = "hsl(" + (Math.random() * 360) + ", 100%,50%)";
players[0].isMain = true;
socket.emit("SetColour", players[0].colour);
socket.emit("SetName", players[0].name);
let yourmov = {
    x: 0,
    y: 0
}
let undoed = false;
let entered = false;
//Main Loop
function Loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    let wobble = Math.random() * (players[0].wobble) * (Math.PI / 180) - players[0].wobble / 2 * (Math.PI / 180);
    if (room == "gun")
        players[0].ShootGun(wobble);
    players[0].mov.x = 0;
    players[0].mov.y = 0;
    if (!textbox.isFocused) {
        if (keys["w"] || keys["ArrowUp"]) {
            players[0].mov.y--;
        }
        if (keys["a"] || keys["ArrowLeft"]) {
            players[0].mov.x--;
        }
        if (keys["s"] || keys["ArrowDown"]) {
            players[0].mov.y++;
        }
        if (keys["d"] || keys["ArrowRight"]) {
            players[0].mov.x++;
        }
    }

    if (keys["Control"] && keys["z"] && !undoed && room == "main") { //undo
        socket.emit("UndoShape");
        players[0].UndoShape();
        undoed = true;
    } else {
        undoed = false;
    }
    if (((keys["Enter"] && !entered) || keys["t"]) && !textbox.isFocused) {
        textbox.isFocused = true;
        if (keys["Enter"]) entered = true;
    } else if (keys["Enter"] && !entered) {
        textbox.isFocused = false;
        entered = true;
        if (textbox.text.length) {
            socket.emit("message", textbox.text);
            textbox.text = "";
        }
    }
    if (!keys["Enter"]) {
        entered = false;
    }
    if (!sameObject(yourmov, players[0].mov)) {
        yourmov = copyObject(players[0].mov);
        socket.emit("KeyChange", players[0].mov, {
            x: players[0].x,
            y: players[0].y
        })
    }
    for (p in players) {
        let player = players[p];
        player.Update();
        player.Draw();
    }
    textbox.update();
    textbox.draw();

    if (messageBoxScroll > messages.length - 10) messageBoxScroll = messages.length - 10;
    if (messageBoxScroll < 0) messageBoxScroll = 0;
    //Draw chat
    if (messages.length && messageBoxFade < 200) {

        ctx.fillStyle = "rgba(185, 220, 250," + (0.75 / Math.pow(messageBoxFade / 200 + 1, 2)) + ")";
        ctx.fillRect(0, c.height / 1.3 - 50, c.width / 3, c.height - c.height / 1.3);
        ctx.fillStyle = "black";
        for (let i = messages.length - 1; i >= Math.max(messages.length - 10, 0); i--) {
            ctx.fillText(messages[i - messageBoxScroll], 2, c.height - 4 - (messages.length - i - 1) * 20 - 50);
        }
    }
    if (!textbox.isFocused)
        messageBoxFade++;
    else messageBoxFade = 0;

    requestAnimationFrame(Loop);
}
Loop();