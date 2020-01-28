//Canvas
let c = document.getElementById("canvas");
c.width = window.innerWidth;
c.height = window.innerHeight;
let ctx = c.getContext("2d");

let socket = io();
let id = socket.id;
let room = "main"
let roomElements = [];
let gunMaps = [
    [{
        type: "wall",
        data: {
            x1: 100,
            y1: 100,
            x2: 200,
            y2: 100,
            health: 100,
            thickness: 10,
            wallIsAlive: true,
            timer: 0
        }
    }, {
        type: "wall",
        data: {
            x1: -100,
            y1: 100,
            x2: -200,
            y2: 100,
            health: 100,
            thickness: 10,
            wallIsAlive: true,
            timer: 0
        }
    }, {
        type: "wall",
        data: {
            x1: 0,
            y1: -100,
            x2: 0,
            y2: -200,
            health: 100,
            thickness: 10,
            wallIsAlive: true,
            timer: 0
        }
    }, {
        type: "wall",
        data: {
            x1: -300,
            y1: -100,
            x2: -300,
            y2: -200,
            health: 100,
            thickness: 10,
            wallIsAlive: true,
            timer: 0
        }
    }, {
        type: "wall",
        data: {
            x1: 300,
            y1: -100,
            x2: 300,
            y2: -200,
            health: 100,
            thickness: 10,
            wallIsAlive: true,
            timer: 0
        }
    }, ]
]

function SetupRoom() {
    if (room == "main") {
        roomElements.splice(0, roomElements.length); //main room doesnt have anything
        camera.bounds.x = c.width / 8 * 3;
        camera.bounds.y = c.height / 8 * 3;
    }
    if (room == "gun") {
        roomElements.splice(0, roomElements.length);
        for (let i = 0; i < gunMaps[0].length; i++)
            roomElements.push(gunMaps[0][i]);
        camera.bounds.x = 600;
        camera.bounds.y = 400;
    }
}

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

function setObject(host, parasite) { //Incase you want to keep stuff
    for (i in parasite) {
        host[i] = parasite[i];
    }
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

    message = players[id].name + ": " + message; //adds the name to the message
    let newMessages = [];

    for (let i = 0; i < message.length; i++) {
        let messageLength = ctx.measureText(message.slice(0, i)).width;
        if (messageLength > c.width / 3 - 4) {
            i--;
            newMessages.push(message.slice(0, i));
            message = message.slice(i, message.length);
            i = 0;
        }
    }
    if (!newMessages.length || message.length) { //means that the message was short enough not to be cut
        newMessages.push(message);
    }
    for (let i = 0; i < newMessages.length; i++) messages.push(newMessages[i]);
    messageBoxFade = 0;
})
socket.on("SendData", (id, data) => {
    setObject(players[id], data);
})
socket.on("DeployWall", (id) => {
    players[id].DeployWall();
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
    let temp = {
        x: mouse.x + camera.x,
        y: mouse.y + camera.y,
        button: []
    }
    if (e.button == 0) {
        mouse.isDown = true;
        temp.isDown = true;
    }
    mouse.button[e.button] = true;
    temp.button[e.button] = true;
    if ((!(mouse.x + c.width / 2 > textbox.x && mouse.x + c.width / 2 < textbox.x + textbox.width && mouse.y + c.height / 2 > textbox.y && mouse.y + c.height / 2 < textbox.y + textbox.height && textbox.isFocused) || !textbox.isFocused) && e.button == 0) {
        if (players[0].MouseDown) //Only run if it actually exists
            players[0].MouseDown(temp);
        socket.emit("MouseDown", temp);
        textbox.isFocused = false;
    }

};
document.onmouseup = e => {
    if (e.button == 0)
        mouse.isDown = false;
    mouse.button[e.button] = false;
    if (players[0].MouseUp && e.button == 0)
        players[0].MouseUp();
    socket.emit("MouseUp");
};
document.onmousemove = e => {
    mouse.old.x = mouse.x;
    mouse.old.y = mouse.y;
    mouse.x = e.clientX - c.getBoundingClientRect().left - c.width / 2;
    mouse.y = e.clientY - c.getBoundingClientRect().top - c.height / 2;
    let temp = {
        x: mouse.x + camera.x,
        y: mouse.y + camera.y
    }
    if (players[0].MouseMove) {
        players[0].MouseMove(temp);
    }
    if (((mouse.old.x != mouse.x || mouse.old.y != mouse.y) && room != "main") || (mouse.isDown && room == "main"))
        socket.emit("MouseMove", temp);
};
document.onwheel = e => {
    let scroll = 0;
    if (e.deltaY > 0) scroll = 1;
    else scroll = -1;
    mouse.wheel += scroll;
    if (players[0].MouseWheel)
        players[0].MouseWheel(scroll);
    socket.emit("MouseWheel", scroll);
}
document.oncontextmenu = e => {
    return false;
}
window.addEventListener("beforeunload", () => {
    socket.disconnect();
})
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
    if (e.key != "F5" && e.key != "F12") e.preventDefault();
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
        ctx.fillRect(this.x - this.width / 2 + c.width / 2 - camera.x, this.y - this.height / 2 + c.height / 2 - camera.y, this.width, this.height);

        //your name
        ctx.fillStyle = "black";
        let nameWidth = ctx.measureText(this.name).width;
        ctx.fillText(this.name, this.x - nameWidth / 2 + c.width / 2 - camera.x, this.y + this.height / 2 + c.height / 2 + 10 - camera.y);
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
        ctx.lineCap = "round";

        for (let shape = 0; shape < this.shapes.length; shape++) {



            if (this.shapes[shape].length < 3) {
                ctx.fillStyle = this.shapes[shape][0].x;
                ctx.beginPath();
                ctx.arc(this.shapes[shape][1].x + c.width / 2 - camera.x, this.shapes[shape][1].y + c.height / 2 - camera.y, this.shapes[shape][0].y / 2, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                ctx.strokeStyle = this.shapes[shape][0].x;
                ctx.lineWidth = this.shapes[shape][0].y;
                ctx.beginPath();
                for (let i = 1; i < this.shapes[shape].length; i++) {
                    if (i == 1) ctx.moveTo(this.shapes[shape][i].x + c.width / 2 - camera.x, this.shapes[shape][i].y + c.height / 2 - camera.y);
                    else ctx.lineTo(this.shapes[shape][i].x + c.width / 2 - camera.x, this.shapes[shape][i].y + c.height / 2 - camera.y);
                }
                ctx.stroke();
            }
        }
        ctx.lineCap = "flat";
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
        this.thickness = Math.max(this.thickness + delta * (this.thickness / 10), 1);
        this.thickness = Math.min(this.thickness, 100);
    }
    UndoShape() {
        this.shapes.splice(this.shape - 1, 1);
        this.shape = Math.max(this.shape - 1, 0);
    }
}
class GunPlayer extends Player {
    constructor(x, y, name, width, height, colour, isMain) {
        super(x, y, name, width, height, colour, isMain);
        this.gun = 0; //Current gun
        this.bullets = []; //Array containing every bullet belonging to the player
        this.lastEnemy; //Last enemy to hit you
        this.score = 0;
        this.health = 100;
        this.cooldown = 0; //How long it has been since the last bullet was fired
        this.visualTimer = 0; //Duration of visual updates
        this.visualAction = 0; //0 is Alive, 1 is Dead, 2 is Respawn Shield
        this.angle = 0; //Current view angle of the player
        this.target = {
            x: 0,
            y: 0
        }
        this.wobble = 20; //adds wobble to the gun, and you have to focus to aim properly
        this.focus = false //Im gonna do whats called a pro gamer move
        this.velocity = {
            x: 0,
            y: 0
        } //only really used for the recoil tbh
        this.mouseIsDown = false;
        this.rightMouseIsDown = false;


        //wall shit and all that
        this.wallWillBeDeployed = false; //only for a deploy animation
        this.deployAnimationFrame = 0;
        this.wallIsDeployed = false;
        this.wall = {
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 100,
            thickness: 10,
            health: 10,
            ticks: 0,
            oX: 0, //Origin
            oY: 0
        }
    }
    Update() {



        this.angle = Math.atan2(this.target.x - this.x, this.target.y - this.y);
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= 0.9;
        this.velocity.y *= 0.9;
        if (Math.abs(this.velocity.x) < 0.2) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < 0.2) this.velocity.y = 0;
        if (this.visualAction == 0 || this.visualAction == 2)
            super.Update();

        if (this.x - this.width / 2 < -camera.bounds.x) this.x = -camera.bounds.x + this.width / 2;
        if (this.x + this.width / 2 > camera.bounds.x) this.x = camera.bounds.x - this.width / 2;
        if (this.y - this.height / 2 < -camera.bounds.y) this.y = -camera.bounds.y + this.height / 2;
        if (this.y + this.height / 2 > camera.bounds.y) this.y = camera.bounds.y - this.height / 2;


        if (this.wallIsDeployed) {
            this.wall.ticks++;
            if (this.wall.ticks > 100 && this.wallWillBeDeployed) {
                this.wall.ticks = 0;
                this.wall.health -= 10;
                if (this.wall.health < 1) {
                    this.wallWillBeDeployed = false;
                }
            }
        }

        if (this.wallWillBeDeployed && !this.wallIsDeployed) { //Deploy animation
            this.deployAnimationFrame++;
            if (this.deployAnimationFrame > 20) {
                this.wallIsDeployed = true;
                this.deployAnimationFrame = 0;
            }
        }

        if (!this.wallWillBeDeployed) this.wallIsDeployed = false;
        //bullet update
        for (let bruh = 0; bruh < 2; bruh++) {
            for (let i = 0; i < this.bullets.length; i++) {
                this.bullets[i].x += Math.sin(this.bullets[i].angle) * this.bullets[i].speed / 2;
                this.bullets[i].y += Math.cos(this.bullets[i].angle) * this.bullets[i].speed / 2;

                if (this.bullets[i].type == 2) {
                    this.bullets[i].speed *= Math.sqrt(1.025);
                }
                if (Math.sqrt(this.bullets[i].x ** 2 + this.bullets[i].y ** 2) > 1500) {
                    this.bullets.splice(i, 1);
                    i--;
                    continue;
                }
                for (p in players) {
                    let player = players[p];
                    //now here's something veri cool
                    if (player.wallIsDeployed) {
                        let x1 = (this.bullets[i].x - player.wall.x1);
                        let y1 = (this.bullets[i].y - player.wall.y1);

                        let x2 = (player.wall.x2 - player.wall.x1);
                        let y2 = (player.wall.y2 - player.wall.y1);

                        let length = Math.sqrt(x2 * x2 + y2 * y2);

                        x2 /= length;
                        y2 /= length;
                        let dp = x1 * (x2) + y1 * (y2);
                        dp /= length;
                        dp = Math.max(Math.min(dp, 1), 0);

                        let lnx = x2 * dp * length + player.wall.x1;
                        let lny = y2 * dp * length + player.wall.y1;
                        let distance = Math.sqrt((lnx - this.bullets[i].x) ** 2 + (lny - this.bullets[i].y) ** 2);
                        let normalAngle = Math.atan2((this.bullets[i].x - lnx), (this.bullets[i].y - lny));
                        if (distance < 5 + player.wall.thickness / 2) {
                            player.wall.health -= this.bullets[i].damage / 2;
                            if (this.bullets[i].type == 2 && player.wallIsDeployed) {
                                this.bullets.splice(i, 1);
                                i--;
                                if (player.wall.health < 1) {
                                    player.wallWillBeDeployed = false;
                                }
                                break;
                            }
                            if (player.wall.health < 1) {
                                player.wallWillBeDeployed = false;
                            } else {
                                this.bullets[i].x += Math.sin(normalAngle) * (10 + player.wall.thickness / 2 - distance);
                                this.bullets[i].y += Math.cos(normalAngle) * (10 + player.wall.thickness / 2 - distance);

                                //we will instead use dynamic collision from Javidx9s video on ball collision
                                let nx = (lnx - this.bullets[i].x) / distance;
                                let ny = (lny - this.bullets[i].y) / distance;

                                let tx = -ny;
                                let ty = nx;
                                let vCos = Math.sin(this.bullets[i].angle);
                                let vSin = Math.cos(this.bullets[i].angle);
                                let dpTan = vCos * tx + vSin * ty;
                                let dpNorm = vCos * nx + vSin * ny;

                                let angle = Math.atan2(dpTan * tx - dpNorm * nx, dpTan * ty - dpNorm * ny)
                                this.bullets[i].angle = angle;
                            }


                        }
                    }
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
                            break;
                        }
                    }





                }
                if (!this.bullets[i]) continue;
                for (let j = 0; j < roomElements.length; j++) {
                    if (roomElements[j].type == "wall") {
                        let x1 = (this.bullets[i].x - roomElements[j].data.x1);
                        let y1 = (this.bullets[i].y - roomElements[j].data.y1);

                        let x2 = (roomElements[j].data.x2 - roomElements[j].data.x1);
                        let y2 = (roomElements[j].data.y2 - roomElements[j].data.y1);

                        let length = Math.sqrt(x2 * x2 + y2 * y2);

                        x2 /= length;
                        y2 /= length;
                        let dp = x1 * (x2) + y1 * (y2);
                        dp /= length;
                        dp = Math.max(Math.min(dp, 1), 0);

                        let lnx = x2 * dp * length + roomElements[j].data.x1;
                        let lny = y2 * dp * length + roomElements[j].data.y1;
                        let distance = Math.sqrt((lnx - this.bullets[i].x) ** 2 + (lny - this.bullets[i].y) ** 2);
                        let normalAngle = Math.atan2((this.bullets[i].x - lnx), (this.bullets[i].y - lny));
                        if (distance < 5 + roomElements[j].data.thickness / 2) {
                            roomElements[j].data.health -= this.bullets[i].damage / 2;
                            if (this.bullets[i].type == 2 && roomElements[j].data.wallIsAlive) {
                                this.bullets.splice(i, 1);
                                i--;
                                if (roomElements[j].data.health < 1) {
                                    roomElements[j].data.wallIsAlive = false;
                                }
                                break;
                            }
                            if (roomElements[j].data.health < 1) {
                                roomElements[j].data.wallIsAlive = false;
                            } else {
                                this.bullets[i].x += Math.sin(normalAngle) * (10 + roomElements[j].data.thickness / 2 - distance);
                                this.bullets[i].y += Math.cos(normalAngle) * (10 + roomElements[j].data.thickness / 2 - distance);

                                //we will instead use dynamic collision from Javidx9s video on ball collision
                                let nx = (lnx - this.bullets[i].x) / distance;
                                let ny = (lny - this.bullets[i].y) / distance;

                                let tx = -ny;
                                let ty = nx;
                                let vCos = Math.sin(this.bullets[i].angle);
                                let vSin = Math.cos(this.bullets[i].angle);
                                let dpTan = vCos * tx + vSin * ty;
                                let dpNorm = vCos * nx + vSin * ny;

                                let angle = Math.atan2(dpTan * tx - dpNorm * nx, dpTan * ty - dpNorm * ny)
                                this.bullets[i].angle = angle;
                            }


                        }
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
        //collide players with enviromental walls too
        for (let i = 0; i < roomElements.length; i++) {
            if (roomElements[i].type != "wall") continue;
            if (roomElements[i].data.wallIsAlive) {
                let x1 = (this.x - roomElements[i].data.x1);
                let y1 = (this.y - roomElements[i].data.y1);

                let x2 = (roomElements[i].data.x2 - roomElements[i].data.x1);
                let y2 = (roomElements[i].data.y2 - roomElements[i].data.y1);

                let length = Math.sqrt(x2 * x2 + y2 * y2);

                x2 /= length;
                y2 /= length;
                let dp = x1 * (x2) + y1 * (y2);
                dp /= length;
                dp = Math.max(Math.min(dp, 1), 0);

                let lnx = x2 * dp * length + roomElements[i].data.x1;
                let lny = y2 * dp * length + roomElements[i].data.y1;
                let distance = Math.sqrt((lnx - this.x) ** 2 + (lny - this.y) ** 2);
                let normalAngle = Math.atan2((this.x - lnx), (this.y - lny));
                if (distance < Math.max(this.width, this.height) / 2 + (roomElements[i].data.thickness * roomElements[i].data.health / 100) / 2) {


                    this.x += Math.sin(normalAngle) * (Math.max(this.width, this.height) / 2 + (roomElements[i].data.thickness * roomElements[i].data.health / 100) / 2 - distance);
                    this.y += Math.cos(normalAngle) * (Math.max(this.width, this.height) / 2 + (roomElements[i].data.thickness * roomElements[i].data.health / 100) / 2 - distance);



                }
            }

        }
        for (player in players) {
            let p = players[player];
            if (p.wallIsDeployed) {
                let x1 = (this.x - p.wall.x1);
                let y1 = (this.y - p.wall.y1);

                let x2 = (p.wall.x2 - p.wall.x1);
                let y2 = (p.wall.y2 - p.wall.y1);

                let length = Math.sqrt(x2 * x2 + y2 * y2);

                x2 /= length;
                y2 /= length;
                let dp = x1 * (x2) + y1 * (y2);
                dp /= length;
                dp = Math.max(Math.min(dp, 1), 0);

                let lnx = x2 * dp * length + p.wall.x1;
                let lny = y2 * dp * length + p.wall.y1;
                let distance = Math.sqrt((lnx - this.x) ** 2 + (lny - this.y) ** 2);
                let normalAngle = Math.atan2((this.x - lnx), (this.y - lny));
                if (distance < Math.max(this.width, this.height) / 2 + (p.wall.thickness * p.wall.health / 100) / 2) {


                    this.x += Math.sin(normalAngle) * (Math.max(this.width, this.height) / 2 + (p.wall.thickness * p.wall.health / 100) / 2 - distance);
                    this.y += Math.cos(normalAngle) * (Math.max(this.width, this.height) / 2 + (p.wall.thickness * p.wall.health / 100) / 2 - distance);



                }
            }

        }
    }
    Draw() {
        //Health bar, cuz we need to see how much health you have, you know?
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 75 / 2 + c.width / 2 - camera.x, this.y - 20 + c.height / 2 - camera.y, 75, 7);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x - 75 / 2 + c.width / 2 - camera.x, this.y - 20 + c.height / 2 - camera.y, this.health / (1 / 3 + 1), 7);
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x - 75 / 2 + c.width / 2 - camera.x, this.y - 20 + c.height / 2 - camera.y, 75, 7);

        //Draw Bullets
        ctx.strokeStyle = "black";
        for (let i = 0; i < this.bullets.length; i++) {
            let thickness = 3;
            let length = 10;
            if (this.bullets[i].type == 2) {
                length = 15;
                thickness = 5;
            } else if (this.bullets[i].type == 1) {
                length = 20;
                thickness = 2;
            }
            let vector = {
                x: Math.sin(this.bullets[i].angle), //used to make some sort of bleh
                y: Math.cos(this.bullets[i].angle)
            }
            ctx.lineWidth = thickness;
            ctx.beginPath();
            ctx.moveTo(this.bullets[i].x - (vector.x * length) + c.width / 2 - camera.x, this.bullets[i].y - (vector.y * length) + c.height / 2 - camera.y);
            ctx.lineTo(this.bullets[i].x + c.width / 2 - camera.x, this.bullets[i].y + c.height / 2 - camera.y);
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
        ctx.moveTo(this.x + c.width / 2 - camera.x, this.y + c.height / 2 - camera.y);
        ctx.lineTo(this.x + x * length + c.width / 2 - camera.x, this.y + y * length + c.height / 2 - camera.y);
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
            let aimGradient1 = ctx.createRadialGradient(this.x + c.width / 2 - camera.x, this.y + c.height / 2 - camera.y, 10, this.x + c.width / 2 - camera.x, this.y + c.height / 2 - camera.y, 100);
            aimGradient1.addColorStop(0, "rgba(255,0,0,0)");
            aimGradient1.addColorStop(1, "rgba(255,0,0," + (1 - this.wobble / 20) + ")");

            ctx.strokeStyle = aimGradient1;
            ctx.beginPath();
            ctx.moveTo(this.x + a1x * 20 + c.width / 2 - camera.x, this.y + a1y * 20 + c.height / 2 - camera.y);
            ctx.lineTo(this.x + a1x * 100 + c.width / 2 - camera.x, this.y + a1y * 100 + c.height / 2 - camera.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + a2x * 20 + c.width / 2 - camera.x, this.y + a2y * 20 + c.height / 2 - camera.y);
            ctx.lineTo(this.x + a2x * 100 + c.width / 2 - camera.x, this.y + a2y * 100 + c.height / 2 - camera.y);
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
            ctx.moveTo(this.x + (Math.random() * (20 - Math.sqrt(this.visualTimer * 2)) + (20 - Math.sqrt(this.visualTimer * 2))) + c.width / 2 - camera.x, this.y + c.height / 2 - camera.y);
            for (let a = 1; a < 15; a++) {
                let amplitude = Math.random() * (20 - Math.sqrt(this.visualTimer * 2)) + (20 - Math.sqrt(this.visualTimer * 2));
                let angle = a * (Math.PI / 7.5);
                ctx.lineTo(this.x + Math.cos(angle) * amplitude + c.width / 2 - camera.x, this.y + Math.sin(angle) * amplitude + c.height / 2 - camera.y);
            }
            ctx.fillStyle = "hsl(" + Math.sqrt(this.visualTimer * 4) + ",100%,50%)";
            ctx.fill();
        }
        if (this.visualAction == 2) {
            ctx.beginPath();
            ctx.arc(this.x + c.width / 2 - camera.x, this.y + c.height / 2 - camera.y, 15, 0, 2 * Math.PI);
            ctx.fillStyle = "hsla(" + (Math.sin(this.visualTimer * (Math.PI / 45)) * 20 + 220) + ", 100%,50%, 0.5)";
            ctx.fill();
        }
        if (this.wallWillBeDeployed && !this.wallIsDeployed) { //Wall is currently deploying
            if (this.deployAnimationFrame < 10)
                ctx.lineWidth = this.wall.thickness / 4;
            else {
                console.log(ctx.lineWidth);
                console.log(this.deployAnimationFrame / 5);
                ctx.lineWidth = this.wall.thickness / 4 * (this.deployAnimationFrame / 5);

            }
            ctx.lineCap = "round";
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.moveTo((this.wall.x1 - this.wall.oX) * Math.min(this.deployAnimationFrame / 10, 1) + this.wall.oX + c.width / 2 - camera.x, (this.wall.y1 - this.wall.oY) * Math.min(this.deployAnimationFrame / 10, 1) + this.wall.oY + c.height / 2 - camera.y);
            ctx.lineTo((this.wall.x2 - this.wall.oX) * Math.min(this.deployAnimationFrame / 10, 1) + this.wall.oX + c.width / 2 - camera.x, (this.wall.y2 - this.wall.oY) * Math.min(this.deployAnimationFrame / 10, 1) + this.wall.oY + c.height / 2 - camera.y);
            ctx.stroke();
            ctx.lineCap = "flat";
            ctx.lineWidth = 1;
        }
        if (this.wallIsDeployed && this.wallWillBeDeployed) {
            ctx.lineWidth = this.wall.thickness * (this.wall.health / 100);
            ctx.lineCap = "round";
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.moveTo(this.wall.x1 + c.width / 2 - camera.x, this.wall.y1 + c.height / 2 - camera.y);
            ctx.lineTo(this.wall.x2 + c.width / 2 - camera.x, this.wall.y2 + c.height / 2 - camera.y);
            ctx.stroke();
            ctx.lineCap = "flat";
            ctx.lineWidth = 1;
        }

    }
    MouseDown(mouse) {
        if (mouse.isDown)
            this.mouseIsDown = true;
        if (mouse.button[2])
            this.rightMouseIsDown = true;
    }
    MouseMove(pos = {
        x: mouse.x,
        y: mouse.y
    }) {
        // this.angle = Math.atan2(pos.x - this.x, pos.y - this.y);
        // this.target = {
        //     x: pos.x - this.x,
        //     y: pos.y - this.y
        // };
        let e = {
            x: pos.x,
            y: pos.y
        }
        this.target = copyObject(e);
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



        if (this.cooldown == 0 && this.mouseIsDown && (this.visualAction == 0)) {
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
                x: this.x, //offset it so that you cant see the bullet behind the player
                y: this.y,
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
    DeployWall() {
        this.wallWillBeDeployed = true;
        this.wall.health = 100;
        let sin = Math.sin(this.angle);
        let cos = Math.cos(this.angle);
        let up = {
            x: sin * 30 - cos * 20 + this.x,
            y: cos * 30 + sin * 20 + this.y
        }
        let down = {
            x: sin * 30 + cos * 20 + this.x,
            y: cos * 30 - sin * 20 + this.y
        }
        this.wall.x1 = up.x;
        this.wall.y1 = up.y;
        this.wall.x2 = down.x;
        this.wall.y2 = down.y;
        this.wall.oX = sin * 30 + this.x;
        this.wall.oY = cos * 30 + this.y;
    }
}
let validRooms = ["main", "gun"]; //do you really want to go to any other room
function DoCommand(input) {
    input = input.slice(1, input.length); //Shaves off the "/"
    let texts = input.split(" "); //Parameters
    if (texts[0] == "goto") { //means you want to go to a different room
        let inputRoom = texts[1];

        for (let i = 0; i < validRooms.length; i++) {
            if (validRooms[i] == inputRoom) {
                socket.emit("ChangeRoom", inputRoom);
                room = inputRoom;
                for (player in players) {
                    if (player != 0)
                        delete players[player];
                }
                SetupRoom();
                let p = GeneratePlayer();
                p.name = players[0].name;
                p.colour = players[0].colour;
                p.isMain = true;

                players[0] = p;
                break;
            }
        }
    } else if (texts[0] == "setname") {
        texts.splice(0, 1);
        let inputName = texts.join(" ");
        players[0].name = inputName;
        socket.emit("SetName", (inputName));
    } else if (texts[0] == "setcolour") {
        texts.splice(0, 1);
        let inputColour = texts.join(" ");
        players[0].colour = inputColour;
        socket.emit("SetColour", (inputColour));
    }
}

let messages = [];
let textbox = {
    x: 0,
    y: c.height - 50,
    width: c.width,
    height: 50,
    cursor: 0,
    text: "",
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
    isFocused: false,
    visibility: 0
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

let camera = { //owo?
    x: 0,
    y: 0,
    bounds: {
        x: c.width / 4 * 3 / 2,
        y: c.height / 4 * 3 / 2
    },
    old: {
        x: 0,
        y: 0
    }
}







ctx.lineJoin = 'round';
//Main Loop
function Loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    let wobble = Math.random() * (players[0].wobble) * (Math.PI / 180) - players[0].wobble / 2 * (Math.PI / 180);
    if (room == "gun")
        players[0].ShootGun(wobble);

    if (room == "main") { //Camera stuff
        camera.old.x = camera.x;
        camera.old.y = camera.y;
        if (players[0].x < camera.bounds.x && players[0].x > -camera.bounds.x && players[0].y < camera.bounds.y && players[0].y > -camera.bounds.y) {

            camera.x += -camera.x / 10; //move to centre
            camera.y += -camera.y / 10;
        } else {
            camera.x += (players[0].x - camera.x) / 10;
            camera.y += (players[0].y - camera.y) / 10;
        }
    } else if (room == "gun") {
        camera.x += (players[0].x - camera.x) / 10;
        camera.y += (players[0].y - camera.y) / 10;
    }
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 1;
    ctx.strokeRect(-camera.x + c.width / 2 - camera.bounds.x, -camera.y + c.height / 2 - camera.bounds.y, camera.bounds.x * 2, camera.bounds.y * 2);



    if (camera.x != camera.old.x && camera.y != camera.old.y) { //camera has moved
        if ((mouse.isDown && room == "main" && players[0].MouseMove) || (room != "main" && players[0].MouseMove)) {
            let temp = {
                x: mouse.x + camera.x,
                y: mouse.y + camera.y
            }
            players[0].MouseMove(temp);
            socket.emit("MouseMove", temp);
        }
    }

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
    } else {
        if (keys["ArrowDown"]) {
            messageBoxScroll--;
        }
        if (keys["ArrowUp"]) {
            messageBoxScroll++;
        }
    }

    if (keys["Control"] && keys["z"] && !undoed && room == "main" && !mouse.isDown) { //undo
        socket.emit("UndoShape");
        players[0].UndoShape();
        undoed = true;
    } else if ((!keys["Control"] || !keys["z"]) && room == "main") {
        undoed = false;
    }
    if (((keys["Enter"] && !entered) || keys["t"]) && !textbox.isFocused) {
        textbox.isFocused = true;
        if (keys["Enter"]) entered = true;
    } else if ((keys["Enter"] && !entered) || keys["Escape"]) {
        textbox.isFocused = false;
        entered = true;
        if (textbox.text.length && keys["Enter"]) {
            if (textbox.text[0] == "/") {
                DoCommand(textbox.text);
            } else {
                socket.emit("message", textbox.text);
            }

        }
        textbox.text = "";
        textbox.cursor = 0;
    }
    if (!keys["Enter"]) {
        entered = false;
    }
    if (keys["e"] && room == "gun" && !players[0].wallIsDeployed && !textbox.isFocused) {
        players[0].DeployWall();
        socket.emit("DeployWall", players[0].angle);
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
    ctx.beginPath();
    let offset = players[0].thickness / 2 + 5;
    ctx.arc(offset, offset, players[0].thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < roomElements.length; i++) {
        if (roomElements[i].type == "wall") {
            if (roomElements[i].data.wallIsAlive) {
                roomElements[i].data.timer = 0; //this is in case the timer isnt 0 when the wall comes back
                ctx.lineWidth = roomElements[i].data.thickness * (roomElements[i].data.health / 100);
                ctx.lineCap = "round";
                ctx.strokeStyle = "black";
                ctx.beginPath();
                ctx.moveTo(roomElements[i].data.x1 + c.width / 2 - camera.x, roomElements[i].data.y1 + c.height / 2 - camera.y);
                ctx.lineTo(roomElements[i].data.x2 + c.width / 2 - camera.x, roomElements[i].data.y2 + c.height / 2 - camera.y);
                ctx.stroke();
                ctx.lineCap = "flat";
                ctx.lineWidth = 1;
            } else {
                roomElements[i].data.timer++;
                ctx.lineWidth = roomElements[i].data.thickness;
                ctx.lineCap = "round";
                ctx.strokeStyle = "rgba(0,0,0," + (Math.sin(roomElements[i].data.timer / 10) / 2 + 0.5) + ")";
                ctx.beginPath();
                ctx.moveTo(roomElements[i].data.x1 + c.width / 2 - camera.x, roomElements[i].data.y1 + c.height / 2 - camera.y);
                ctx.lineTo(roomElements[i].data.x2 + c.width / 2 - camera.x, roomElements[i].data.y2 + c.height / 2 - camera.y);
                ctx.stroke();
                ctx.lineCap = "flat";
                ctx.lineWidth = 1;
                if (roomElements[i].data.timer > 200) {
                    roomElements[i].data.health = 100;
                    roomElements[i].data.wallIsAlive = true;
                }
            }
        }
    }
    textbox.update();
    textbox.draw();

    if (messageBoxScroll > messages.length - 10) messageBoxScroll = messages.length - 10;
    if (messageBoxScroll < 0) messageBoxScroll = 0;
    //Draw chat
    if (messages.length && messageBoxFade < 200) {
        ctx.font = "11px Arial";
        ctx.fillStyle = "rgba(185, 220, 250," + (0.75 / Math.pow(messageBoxFade / 200 + 1, 2)) + ")";
        ctx.fillRect(0, c.height - 250, c.width / 3, 200);
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