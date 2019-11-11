var express = require('express');
var app = express();
var path = require('path');
var http = require('http').createServer(app);
var htmlPath = path.join(__dirname, "main")
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
let badWords = "ahole*,anal,anally,anus*,arse*,arss*,ashole*,asshole*,asswipe*,asslick*,*ballsdeep*,*bastard*,biatch*,bish,*bitch*,*blowjob*,*bollock*,*boner,bukkak*,butthole*,buttlick*,buttplug*,buttwipe*,carpetmunch*,chink*,chode*,choad*,clit*,*cnts*,cock*,cok,cokbite*,cokhead*,cokjock*,cokmunch*,coks,coksuck*,coksmoke*,cuck,cuckold,cum,cunnie*,cunnilingus*,cunny*,*cunt*,*dick*,dik,dike*,diks,dildo*,douche*,doosh*,dooch*,*dumbars*,*dumars*,*dumass*,edjaculat*,ejacculat*,ejackulat*,ejaculat*,ejaculit*,ejakulat*,enema*,faeces*,fag*,fap,fapping*,*fatars*,*fatass*,fck*,*fcuk*,feces*,felatio*,felch*,feltch*,flikker*,*foreskin*,*forskin*,*fvck*,*fuck*,*fudgepack*,*fuk*,gaylord,*handjob*,hardon*,*hitler*,hoar,honkey*,*jackars*,*jackass*,*jackoff*,jap,*jerkoff*,jigaboo*,jiss*,*jizz*,kike*,knobjock*,knobrid*,knobsuck*,kooch*,kootch*,kraut*,kunt*,kyke*,*lardars*,*lardass*,lesbo*,lessie*,lezzie*,lezzy*,*masturbat*,minge*,minging*,mofo,muffdive*,munge*,munging*,*nazi*,*negro*,niga,nigg*,niglet*,niqqa,nutsack*,*orgasm*,*orgasum*,panooch,pecker,peanis,peeenis,peeenus,peeenusss,peenis,peenus,peinus,penas,*penis*,penor,penus,phuc,phuck*,phuk*,pissflap,poon,poonani,poonanni,poonanny,poonany,poontang,porn*,pula,pule,punani,punanni,punanny,punany,pusse,pussee,pussie,pussies,pussy,pussying,pussylick*,pussysuck*,poossy*,poossie*,puuke,puuker,queef*,queer*,qweer*,qweir*,recktum*,rectum*,renob,retard*,rimming*,rimjob*,ruski*,sadist*,scank*,schlong*,schmuck*,scrote*,scrotum*,semen*,sex*,shag,shat,shemale*,*shit*,skank*,*slut*,spic,spick,spik,stalin,tard,teets,testic*,tit,tits,titt,titty*,tittie*,twat*,*vagina*,*vaginna*,*vaggina*,*vaagina*,*vagiina*,vag,vags,vaj,vajs,*vajina*,*vulva*,wank*,*whoar*,whoe,*whor*,*B=D*,*B==D*,*B===*,*===D,8===*".toLowerCase().split(",");

function swearCheck(m, words) {
  words.forEach(word => {
    if (m.toLowerCase().includes(word.toLowerCase())) return false;
  })
  return true;
}

io.on("connection", function (socket) {
  let messageTime = new Date();
  let id = socket.id;
  socket.join("Main");
  for (client in clients) {
    if (clients[client].room == "Main")
      socket.emit("GetPlayers", clients[client], client);
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
    room: "Main"
  };

  //socket.emit("GetId", id);

  console.log(id + " joined!");

  socket.to("Main").emit("PlayerJoined", id);




  socket.on("sendInfo", (name, colour) => { //Information about the player when they join, such as their colour and their name
    if (!swearCheck(name, badWords)) {
      name = "*****";
    }
    clients[id] = {
      name: name,
      colour: colour,
      x: clients[id].x,
      y: clients[id].y,
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
      room: clients[id].room
    };
    socket.to(clients[id].room).emit("PlayerInfoRecieved", id, name, colour);
    console.log(clients[id].room);
  })
  socket.on("keychange", (keys, x, y) => {
    clients[id].keys = copyObject(keys);
    clients[id].x = x;
    clients[id].y = y;
    socket.to(clients[id].room).emit("PlayerKeyChange", id, keys, x, y);
  })
  socket.on("disconnect", () => {
    socket.to(clients[id].room).emit("PlayerLeave", id);
    delete clients[id];
    console.log(id + " left...");
  })
  socket.on("message", (message) => {
    if (message.length > 125) {
      message = "ERROR: this message was too long for the game to handle. LIMIT: 125 CHARS"
    }
    clients[id].spam = new Date() - messageTime;
    if (clients[id].spam < 20 && swearCheck(message, badWords)) {
      socket.to(clients[id].room).emit("message", id, message);
      messageTime = new Date();
    }


  })
  socket.on("AddLine", (x, y) => {
    clients[id].shapes[clients[id].shape].push([x, y]);
    socket.to("Main").emit("AddLine", id, x, y);
  })
  socket.on("EndShape", () => {
    clients[id].shape++;
    clients[id].shapes[clients[id].shape] = [];
    socket.to("Main").emit("EndShape", id)
  })
  socket.on("UndoShape", () => {
    clients[id].shapes.splice(clients[id].shape - 1, 1);
    clients[id].shape--;
    clients[id].shape = Math.max(clients[id].shape, 0);
    clients[id].shapes[clients[id].shape] = [];

    socket.to("Main").emit("UndoShape", id);
  })
  socket.on("ChangeRoom", (room) => {
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
})


http.listen(process.env.PORT || 80, function () {
  console.log("Everything is working fine!");
});