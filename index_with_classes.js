const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser');
const SocketController = require('./socket-controller.js')
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors())
const MongoClient = require('mongodb').MongoClient;
const dbUrl = "mongodb+srv://admin:admin@cluster0-3fbr6.gcp.mongodb.net/test?retryWrites=true&w=majority";
let str = "";

const server = require('http').createServer(app);
const io = require('socket.io')(server);
const dbName = "copa-db";
let mongodb;

MongoClient.connect(dbUrl, {  
    poolSize: 10
},function(err, db) {
        mongodb=db;
    }
);

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});


// app.post('/addClip', (req, res) => {
//     console.log('Got body:', req.body);
//     var dbo = mongodb.db(dbName);
//     myobj = req.body;
//     dbo.collection("clips").insertOne(myobj, function(err, res) {
//         if (err) throw err;
//         console.log("1 document inserted");
//         });
//     res.send(200);
// });

app.route('/clips/:userId').get(function(req, res) {
    userId = req.params.userId;
    console.log(userId);
    main_result = {};
    var dbo = mongodb.db(dbName);
    var query = {userId: userId};
    dbo.collection("clips").find(query).toArray(function(err, result) {
      if (err) throw err;
      main_result = result;
    //   console.log(result);
      res.send(result);
    });
    //res.send(main_result);
});

app.route('/deleteClip').delete(function(req, res) {
    console.log('Got body DELETE:', req.body);
    let result = {};
    var dbo = mongodb.db(dbName);
    id = req.body._id;
    console.log("Id to be deleted: "+id)
    var myquery = { _id: new mongodb.ObjectID(id) };
    dbo.collection("clips").deleteOne(myquery, function(err, res) {
        if (err) throw err;
        result["success"] = true
        result["message"] = "Successfully deleted the document"
        res.status(200);
        res.send(result);
    });    
});

let socketController = new SocketController(mongodb);

io.on('connection', function(socket) {  
    console.log('Desktop Client connected...');
    // socket.emit('message','you are connected');
    socket.on("join", socketController.joinCallback);
    socket.on("leave", socketController.leaveCallback);
    socket.on('desktopClient', socketController.saveToDatabaseCallback);    
    socket.on('mobileClient',socketController.saveToDatabaseCallback);        
});

server.listen(3000);