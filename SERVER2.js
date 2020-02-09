var express = require('express');
var app = express();
var path = require('path');
var http = require('http').createServer(app);
var htmlPath = path.join(__dirname, "main2")
var io = require('socket.io')(http);

let clients = [];

function copyObject(object) {
  let ob = new Object();
  for (i in object) {
    ob[i] = object[i];
  }
  return ob;
}

app.get("/", (req, res) => {
  res.sendFile(htmlPath + "/index.html");
})

app.use(express.static(htmlPath));
let startTime = new Date();

//BAD WORDS
let badWords = " anal ,anally,assipe,asslick,ballsdeep,blowjob,bollock,boner,bukkak,buttlick,buttplug,clit,cock,cokhead,coksuck,cuck,cuckold,cum,cunnilingus,cunt,dildo,ejaculate,fag,fap,fappingforeskin,forskin,gaylord,handjob,jackars,jackass,jackoff,jerkoff,knobjock,knobrid,knobsuck,kooch,kootch,kraut,kut,masturbat,minge,minging,mofo,muffdive,munge,munging,negro,niga,nigg,niglet,niqqa,nutsack,orgasm,orgasum,peenis,peenus,penis,porn,pusse,pussee,pussie,pussies,pussy,pussying,pussylick,pussysuck,poossy,poossie,puuke,puuker,queef,queer,qweer,renob,rimming,rimjob,ruski,scank,scrote,semen,sex,shag,shat,skank,slut,spic,spick,spik,tard,teets,testic,tit,tits,titt,titty,tittie,twat,vagina,vaginna,vaggina,vaagina,vagiina,vag,vags,vaj,vajs,vajina,vulva,wank,whoar,whoe,whor,B=D,B==D,B===,===D,8===".toLowerCase().split(",");

function swearCheck(m, words) { //returns true if it contains a swear word //DEPRECATED
  for (word of words) {
    if (m.toLowerCase().includes(word)) return true;
  }
  return false;
}

function SwearFilter(m, words) { //i give up
  for (word of words) {
    let w = new RegExp(word, "ig");
    let len = word.length;
    m.replaceAll(w, "*".repeat(len));
  }
  return m;
}

let startingRoom = "main";
io.on("connection", function (socket) {
  let messageTime = new Date();
  let id = socket.id;
  socket.join(startingRoom);
  for (client in clients) {
    if (clients[client].room == startingRoom) {
      socket.emit("PlayerJoined", client);
      socket.emit("SendData", client, clients[client]);
    }
  }
  clients[id] = {
    name: "Choosing a name",
    colour: null,
    x: 0,
    y: 0,
    keys: {
      left: false,
      right: false,
      up: false,
      down: false
    },
    spam: 0,
    shapes: [

    ],
    shape: 0,
    room: startingRoom,
    gun: 0,
    angle: 0,
    paint: "black",
    thickness: 1,
    mouseIsDown: false,
    wallIsDeployed: false,
    wall: {
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
  };

  console.log(id + " joined!");

  socket.to(startingRoom).emit("PlayerJoined", id);



  socket.on("SetName", (name) => {
    if (clients[id].name == "Choosing a name") {
      console.log(clients[id].name + " set their name to " + name);
    } else {
      console.log(clients[id].name + " changed their name to " + name);
    }
    clients[id].name = name;
    socket.to(clients[id].room).emit("SetName", id, name);
  })
  socket.on("SetColour", (colour) => {
    if (!clients[id].colour) {
      console.log((clients[id].name == "Choosing a name" ? id : clients[id].name) + " set their colour to " + colour);
    } else {
      console.log((clients[id].name == "Choosing a name" ? id : clients[id].name) + " changed their colour to " + colour);

    }
    clients[id].colour = colour;
    socket.to(clients[id].room).emit("SetColour", id, colour);
  })
  socket.on("KeyChange", (mov, pos) => {
    clients[id].mov = copyObject(mov);
    clients[id].x = pos.x;
    clients[id].y = pos.y;
    socket.to(clients[id].room).emit("KeyChange", id, mov, pos);
  })
  socket.on("disconnect", () => {
    socket.to(clients[id].room).emit("PlayerLeave", id);
    console.log(clients[id].name + "disconnected..");
    delete clients[id];
  })
  socket.on("message", (message) => {
    console.log(clients[id].name + ": " + message);
    if (message.length > 150) {
      message = "ERROR: this message was too long for the game to handle. LIMIT: 125 CHARS"
    }
    clients[id].spam = new Date() - messageTime;
    if (clients[id].spam > 100 && message) {
      io.in(clients[id].room).emit("message", id, message);
      messageTime = new Date();
    }


  })
  socket.on("MouseDown", (pos = {
    x: 0,
    y: 0
  }, wobble) => {
    clients[id].mouseIsDown = true;
    socket.to(clients[id].room).emit("MouseDown", id, pos, wobble);
    if (clients[id].room == "main") {
      clients[id].shapes[clients[id].shape] = [];
      clients[id].shapes[clients[id].shape][0] = {
        x: clients[id].paint,
        y: clients[id].thickness
      }
      clients[id].shapes[clients[id].shape][1] = pos;
    }
  })
  socket.on("MouseMove", (pos) => {
    socket.to(clients[id].room).emit("MouseMove", id, pos);
    if (clients[id].room == "main") {
      if (clients[id].shapes[clients[id].shape]) {
        clients[id].shapes[clients[id].shape].push(pos);
      }
    }
  })
  socket.on("MouseUp", () => {
    clients[id].mouseIsDown = false;
    socket.to(clients[id].room).emit("MouseUp", id);
    if (clients[id].room == "main") {
      clients[id].shape++;
    }
  })
  // socket.on("StartShape", (pos) => {
  //   clients[id].shapes[clients[id].shape] = [];
  //   clients[id].shapes[clients[id].shape][0] = {
  //     x: clients[id].paint,
  //     y: clients[id].thickness
  //   }
  //   clients[id].shapes[clients[id].shape][1] = pos;
  //   socket.to("main").emit("StartShape", id, pos);
  // })
  // socket.on("AddLine", (pos) => {
  //   if (clients[id].shapes[clients[id].shape]) {
  //     clients[id].shapes[clients[id].shape].push(pos);
  //     socket.to("main").emit("AddLine", id, pos);
  //   }
  // })
  // socket.on("EndShape", () => {
  //   clients[id].shape++;
  //   socket.to("main").emit("EndShape", id)
  // })
  socket.on("UndoShape", () => {
    clients[id].shapes.splice(clients[id].shape - 1, 1);
    clients[id].shape--;
    clients[id].shape = Math.max(clients[id].shape, 0);
    clients[id].shapes[clients[id].shape] = [];

    socket.to("main").emit("UndoShape", id);
  })
  socket.on("ChangeRoom", (room) => {
    for (let i = clients[id].shapes.length - 1; i >= 0; i--) {
      clients[id].shapes.splice(i, 1);
    }
    clients[id].shapes[0] = [];
    clients[id].shape = 0;
    clients[id].x = 0;
    clients[id].y = 0;
    socket.leave(clients[id].room);
    socket.to(clients[id].room).emit("PlayerLeave", id);
    console.log(clients[id].name + " left room " + clients[id].room + " and joined " + room);
    socket.join(room);
    clients[id].room = room;
    socket.to(clients[id].room).emit("PlayerJoined", id);
    socket.to(clients[id].room).emit("SendData", id, clients[id]);
    for (client in clients) {
      if (clients[client].room == clients[id].room && client != id) {
        socket.emit("PlayerJoined", client);
        socket.emit("SendData", client, clients[client]);
      }
    }
  })
  socket.on("ShootGun", (wobble) => { //Actually really bloody simple if you literally take one look at it
    socket.to(clients[id].room).emit("ShootGun", id, wobble);
  })
  socket.on("MouseWheel", (delta) => {
    socket.to(clients[id].room).emit("MouseWheel", id, delta);
    if (clients[id].room == "main") {
      clients[id].thickness = Math.max(clients[id].thickness + delta * (clients[id].thickness / 10), 1);
      clients[id].thickness = Math.min(clients[id].thickness, 100);
    }
    if (clients[id].room == "gun") {
      let diff = Math.round(delta);
      clients[id].gun += diff;
      clients[id].gun %= 3;
      while (clients[id].gun < 0) clients[id].gun += 3;
    }
  })
  socket.on("DeployWall", (angle) => {
    socket.to(clients[id].room).emit("DeployWall", id);
    clients[id].wallWillBeDeployed = true;
    clients[id].wall.health = 100;
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);
    let up = {
      x: sin * 30 - cos * 20 + clients[id].x,
      y: cos * 30 + sin * 20 + clients[id].y
    }
    let down = {
      x: sin * 30 + cos * 20 + clients[id].x,
      y: cos * 30 - sin * 20 + clients[id].y
    }
    clients[id].wall.x1 = up.x;
    clients[id].wall.y1 = up.y;
    clients[id].wall.x2 = down.x;
    clients[id].wall.y2 = down.y;
    clients[id].wall.oX = sin * 30 + clients[id].x;
    clients[id].wall.oY = cos * 30 + clients[id].y;
  })
})


http.listen(process.env.PORT || 80, function () {
  console.log("Everything is working fine!");
});