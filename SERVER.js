var express = require('express');
var app = express();
var path = require('path');
var http = require('http').createServer(app);
var htmlPath = path.join(__dirname, "main")
var io = require('socket.io')(http);

let clients = []; //Indexed by socket id

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

io.on("connection", function (socket) {
  let id = socket.id;
  for (client in clients) {
    socket.emit("GetPlayers", clients[client], client);
  }
  clients[id] = {
    x: 0,
    y: 0
  };

  socket.emit("GetId", id);

  console.log(id + " joined!");

  socket.broadcast.emit("PlayerJoined", id);

  console.log("Sent Player Join Emit");



  socket.on("sendInfo", (name, colour) => { //Information about the player when they join, such as their colour and their name
    clients[id] = {
      name: name,
      colour: colour,
      x: 0,
      y: 0,
      keys: {
        left: false,
        right: false,
        up: false,
        down: false
      }
    };
    socket.broadcast.emit("PlayerInfoRecieved", id, name, colour);
  })
  socket.on("keychange", (keys, x, y) => {
    clients[id].keys = copyObject(keys);
    clients[id].x = x;
    clients[id].y = y;
    socket.broadcast.emit("PlayerKeyChange", id, keys, x, y);
  })
  socket.on("disconnect", function () {
    socket.broadcast.emit("PlayerLeave", id);
    delete clients[id];
    console.log(id + " left...");
  })
})


http.listen(3000, function () {
  console.log("Everything is working fine!");
});