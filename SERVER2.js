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

let startingRoom = "GunGame";
io.on("connection", function (socket) {
  let messageTime = new Date();
  let id = socket.id;
  socket.join(startingRoom);
  for (client in clients) {
    if (clients[client].room == startingRoom) {
      socket.emit("PlayerJoined", client);
      socket.emit("SetName", client, clients[client].name);
      socket.emit("SetColour", client, clients[client].colour);
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
      []
    ],
    shape: 0,
    room: startingRoom,
    gun: 0,
    angle: 0,
    paint: "black",
    thickness: 1,
    mouseIsDown: false
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
    delete clients[id];
    console.log(id + " left...");
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
    if (clients[id].room == "Main") {
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
    if (clients[id].room == "Main") {
      if (clients[id].shapes[clients[id].shape]) {
        clients[id].shapes[clients[id].shape].push(pos);
      }
    }
  })
  socket.on("MouseUp", () => {
    clients[id].mouseIsDown = false;
    socket.to(clients[id].room).emit("MouseUp", id);
    if (clients[id].room == "Main") {
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
  //   socket.to("Main").emit("StartShape", id, pos);
  // })
  // socket.on("AddLine", (pos) => {
  //   if (clients[id].shapes[clients[id].shape]) {
  //     clients[id].shapes[clients[id].shape].push(pos);
  //     socket.to("Main").emit("AddLine", id, pos);
  //   }
  // })
  // socket.on("EndShape", () => {
  //   clients[id].shape++;
  //   socket.to("Main").emit("EndShape", id)
  // })
  socket.on("UndoShape", () => {
    clients[id].shapes.splice(clients[id].shape - 1, 1);
    clients[id].shape--;
    clients[id].shape = Math.max(clients[id].shape, 0);
    clients[id].shapes[clients[id].shape] = [];

    socket.to("Main").emit("UndoShape", id);
  })
  socket.on("ChangeRoom", (room) => {
    for (let i = clients[id].shapes.length - 1; i >= 0; i--) {
      clients[id].shapes.splice(i, 1);
    }
    clients[id].shapes[0] = [];
    clients[id].shape = 0;
    socket.leave(clients[id].room);
    socket.to(clients[id].room).emit("PlayerLeave", id);
    console.log(clients[id].name + " left room " + clients[id].room + " and joined " + room);
    socket.join(room);
    clients[id].room = room;
    socket.to(clients[id].room).emit("PlayerJoined", id);
    socket.to(clients[id].room).emit("PlayerInfoRecieved", id, clients[id].name, clients[id].colour);
    for (client in clients) {
      if (clients[client].room == clients[id].room && client != id) {
        socket.emit("GetPlayers", clients[client], client);
        socket.emit("PlayerInfoRecieved", client, clients[client].name, clients[client].colour);
      }
    }
  })
  socket.on("ShootGun", (wobble) => { //Actually really bloody simple if you literally take one look at it
    socket.to(clients[id].room).emit("ShootGun", id, wobble);
  })
  socket.on("MouseWheel", (delta) => {
    socket.to(clients[id].room).emit("MouseWheel", id, delta);
  })
})


http.listen(process.env.PORT || 80, function () {
  console.log("Everything is working fine!");
});