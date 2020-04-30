const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser');
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
const Keycloak = require('keycloak-connect');
const session = require('express-session');


let memoryStore = new session.MemoryStore();
let keycloak = new Keycloak({ store: memoryStore });
const PORT = process.env.PORT || 3010;
const USERINFO_ENDPOINT = "https://copa-keycloak.herokuapp.com/auth/realms/copa/protocol/openid-connect/userinfo"
const jwtDecode = require('jwt-decode');
const ObjectId = require('mongodb').ObjectID;
const socketUtils = require('./socket-controller')

//session
app.use(session({
  secret:'thisShouldBeLongAndSecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

app.use(keycloak.middleware());

MongoClient.connect(dbUrl, {  
    poolSize: 10
},function(err, db) {
        mongodb=db;
    }
);

app.use( keycloak.middleware( { logout: '/logout'} ));

app.use(express.static(__dirname + '/node_modules'));
app.get('/',function(req, res,next) {    
    res.sendFile(__dirname + '/index.html');
});

app.get('/test', keycloak.protect(), function(req, res,next) {    
    res.send({"message": "This is a test API"});
});

function getUserId(req) {
    let token = req.headers.authorization.split("Bearer")[1].trim();
    let decodedToken = jwtDecode(token);
    let userId = decodedToken["preferred_username"];

    return userId
}
app.post('/addClip', keycloak.protect(), (req, res) => {
    /*  
    Request body format: 
    {
        fromType: string;
        from: string;
        timestamp: string;
        clipboardText: string;
    }
    */
    userId = getUserId(req);
    console.log("user id:", userId)
    console.log('Got body:', req.body);
    let dbo = mongodb.db(dbName);
    myobj = req.body;
    myobj["userId"] = userId
    myobj["timestamp"] = Number(myobj["timestamp"])
    dbo.collection("clips").updateOne(
        {
            "clipboardText": myobj["clipboardText"],
            "from": myobj["from"],
            "fromType": myobj["fromType"]
        }, 
        {"$set": myobj}, 
        {upsert: true}, 
        function(err, dbResult) {
            if (err) throw err;
            console.log("1 document inserted");
            io.sockets.in("room-"+userId).emit("newData", myobj);      
            let result = {}
            result["success"] = true
            result["message"] = "Successfully added the clipboard text"
            res.send(result);
        });    
});

app.get('/clips/:userId', keycloak.protect(), function(req, res) {
    userId = req.params["userId"];
    console.log("clips api: ", userId);
    
    let dbo = mongodb.db(dbName);
    let query = {userId: userId};
    dbo.collection("clips").find(query).toArray(function(err, result) {
      if (err) throw err;    
        res.send(JSON.stringify(result));
    });
});

app.delete('/deleteClip', keycloak.protect(), function(req, res) {
    console.log('Got body DELETE:', req.body);
    let dbo = mongodb.db(dbName);
    id = req.body["_id"]+"";
    fromType = req.body["fromType"];
    userId = getUserId(req)
    console.log("user id:", userId)
    console.log("Id to be deleted: "+id)
    let myquery = { _id: new ObjectId(id) };
    dbo.collection("clips").deleteOne(myquery, function(err, dbResult) {
        if (err) throw err;
        let result = {};     
        if(dbResult.result.n > 0) {
            result["success"] = true
            result["message"] = "Successfully deleted the clipboard text"  
            io.sockets.in("room-"+userId).emit("newDataArrived", {
                "fromType": fromType,
                "success": true
            });            
        } else {
            result["success"] = false
            result["message"] = "Document not found"        
        }
        res.send(result);
    });    
});

io.on('connection', function(socket) {  
    socket.on("join", function(reqObj) {
        if("token" in reqObj) {
            let {token} = reqObj;
            const options = {
                method: 'GET',
                url: USERINFO_ENDPOINT,
                headers: {
                    Authorization: "Bearer "+token
                },
               json: true
            }
            const request = require('request');
            request(options, (err, res, body) => {
                if (err) { return console.log(err); }
                if("error" in body) {
                    console.log("Invalid token");
                    socket.emit({success: false})
                } else {
                    let decodedToken = jwtDecode(token);
                    let userId = decodedToken["preferred_username"];
                    console.log("User joined: ",userId)
                    socket.join("room-"+userId);   
                    socket.emit({success: true})                                     
                }
            });


            let decodedToken = jwtDecode(token);
            let userId = decodedToken["preferred_username"];
            console.log("User joined: ",userId)
            socket.join("room-"+userId);   
            socket.emit({success: true})    
        }   
    });
    socket.on("leave", function(reqObj) {
        let {token} = reqObj;
        let decodedToken = jwtDecode(token);
        let userId = decodedToken["preferred_username"];
        console.log("User left: ",userId)
        socket.leave("room-"+userId);
        socket.emit({
            message:'you are removed from the room '
        });
    });    
});

server.listen(PORT)
console.log('HTTP Server listening on: %s', PORT);
