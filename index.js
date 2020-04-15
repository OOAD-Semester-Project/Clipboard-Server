const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://admin:admin@clipboard-rtfg2.mongodb.net/test?retryWrites=true&w=majority";
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


app.post('/addClip', (req, res) => {
    console.log('Got body:', req.body);
    var dbo = mongodb.db(dbName);
    myobj = req.body;
    dbo.collection("clips").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
        });
    res.send(200);
});

app.route('/clips/:userId').get(function(req, res) {
    userId = req.params.userId;
    console.log(userId);
    main_result = {};
    if (err) throw err;
    var dbo = mongodb.db(dbName);
    var query = {user: userId};
    dbo.collection("clips").find(query).toArray(function(err, result) {
      if (err) throw err;
      main_result = result;
      //console.log(result);
      db.close();
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
        db.close();
    });
    res.status(200);
    res.send(result);
});

io.on('connection', function(socket) {  
    console.log('Desktop Client connected...');
    socket.emit('message','you are connected');
    socket.on('desktopClient',function(reqObj){
            let userId = reqObj["userId"];
            let clipData = reqObj["clipboardText"]
            var dbo = mongodb.db(dbName);
            myobj = data;
            dbo.collection("clips").insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
              });
              socket.to('mobileClient').emit(data,'From Desktop');
    });

    socket.on('mobileClient',function(data){
            var dbo = mongodb.db(dbName);
            myobj = data;
            dbo.collection("clips").insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
              });
              socket.emit('message','From Desktop');
              socket.to('desktopClient').emit(data,'From Desktop');
    });
    //below code is not needed
    socket.on('join', function(data) {
        console.log(data);
        socket.emit('messages', 'Hello from server');
    });
});
/* 

<script>
 var socket = io.connect();
 socket.on('connect', function(data) {
    socket.emit('join', 'Hello World from client');
 });
 socket.on('broad', function(data) {
         $('#future').append(data+ "<br/>");
   });

 $('form').submit(function(e){
     e.preventDefault();
     var message = $('#chat_input').val();
     socket.emit('messages', message);
 });
</script>


*/

server.listen(3000);



//var server = app.listen(3000, function() {console.log("Server listening on port http://localhost:3000 ");});