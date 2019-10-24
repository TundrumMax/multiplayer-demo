let socket = io();
let yourId = 0;
socket.on("GetId", (id) => yourId = id);
socket.on("PlayerJoined", (id) => {

  players[id] = new Player(0, 0);
})
socket.on("PlayerInfoRecieved", (id, name, colour) => {

  players[id].name = name;
  players[id].colour = colour;


})
socket.on("PlayerKeyChange", (id, keys, x, y) => {
  players[id].keys = keys;
  players[id].x = x;
  players[id].y = y;
})
socket.on("PlayerLeave", (id) => {
  delete players[id];
})
socket.on("GetPlayers", (info, id) => {
  players[id] = new Player(0, 0);
  players[id].x = info.x;
  players[id].y = info.y;
  players[id].keys = copyObject(info.keys);
  players[id].name = info.name;
  players[id].colour = info.colour;
})
let keys = [];
let keyMat = { //previous keys
  left: false,
  right: false,
  up: false,
  down: false
}
document.addEventListener("keydown", function (e) {
  keys[e.key] = true;
})
document.addEventListener("keyup", function (e) {
  keys[e.key] = false;
})

let c = document.getElementById("canvas");
let ctx = c.getContext("2d");
c.width = window.innerWidth;
c.height = window.innerHeight;

function sameObject(ob1, ob2) {
  for (i in ob1) { //Go through ob1
    if (ob2[i] != ob1[i]) return false;
  }
  for (i in ob2) { //Go through ob2
    if (ob2[i] != ob1[i]) return false;
  }
  return true;
}

function copyObject(object) {
  let ob = new Object();
  for (i in object) {
    ob[i] = object[i];
  }
  return ob;
}



let players = []; //Players will be indexed by their ID
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.colour = null;
    this.name = "Choosing a name";
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false
    }
  }
  Draw() {
    ctx.fillStyle = this.colour;
    ctx.fillRect((this.x + c.width / 2) - 5, (this.y + c.height / 2) - 5, 10, 10);
    ctx.fillStyle = "black";
    let textWidth = ctx.measureText(this.name);
    ctx.fillText(this.name, (this.x + c.width / 2) - textWidth.width / 2, (this.y + c.height / 2) + 15);
  }
  Update() {
    if (this.keys.up) this.y--;
    if (this.keys.down) this.y++;
    if (this.keys.left) this.x--;
    if (this.keys.right) this.x++;
  }
}
players[0] = new Player(0, 0);

let name = prompt("What is your name?");
let colour = "hsl(" + Math.random() * 360 + ", 100%, 50%)";
players[0].name = name;
players[0].colour = colour;

socket.emit("sendInfo", name, colour);


function Loop() {
  ctx.clearRect(0, 0, c.width, c.height);
  if (keys["ArrowUp"]) {
    players[0].keys.up = true;
  } else players[0].keys.up = false;
  if (keys["ArrowDown"]) {
    players[0].keys.down = true;
  } else players[0].keys.down = false;
  if (keys["ArrowLeft"]) {
    players[0].keys.left = true;
  } else players[0].keys.left = false;
  if (keys["ArrowRight"]) {
    players[0].keys.right = true;
  } else players[0].keys.right = false;

  if (sameObject(keyMat, players[0].keys)) {
    socket.emit("keychange", players[0].keys, players[0].x, players[0].y);
    keyMat = copyObject(players[0].keys)
  }

  for (p in players) {
    let player = players[p];
    player.Update();
    player.Draw();
  }

  requestAnimationFrame(Loop);
}
window.onload = () => Loop();