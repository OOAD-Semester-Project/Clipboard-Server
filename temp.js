const app = require('http').createServer(handler)
const io = require('socket.io')(app);
const fs = require('fs');

app.listen(3000);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', (socket) => {
    socket.on("join", function(reqObj) {        
        socket.join("room-1");        
        console.log(Object.keys(io.sockets.adapter.rooms["room-1"]["sockets"]));
        clients = Object.keys(io.sockets.adapter.rooms["room-1"]["sockets"])
        clients.forEach(socketId => {
            io.in("room-1").emit("newData", {"tempkey": "abc"});       
            io.in("room-1").emit("newData", {"tempkey": "abc1"});       
        });
        console.log(io.sockets.adapter.rooms);
    });
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', (data) => {
        console.log(data);
    });
});