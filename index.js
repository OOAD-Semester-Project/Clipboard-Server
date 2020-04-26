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
const https = require('https')


let memoryStore = new session.MemoryStore();
let keycloak = new Keycloak({ store: memoryStore });
const PORT = process.env.PORT || 3000;
const USERINFO_ENDPOINT = "https://copa-keycloak.herokuapp.com/auth/realms/copa/protocol/openid-connect/userinfo"
const jwtDecode = require('jwt-decode');

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

// app.get('/logoff', keycloak.protect(), (req, res) => {
//     console.log('logout clicked');
//     res.send('http://' + HOST + ':3000/logout');
// });

// app.get("/signout", (req, res, next) => {
// 	console.log('Attempting to logout');
// 	req.logout();
// 	req.session.destroy();
// 	res.redirect('/');
// });

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
    let token = req.headers.authorization.split("Bearer")[1].trim();
    let decodedToken = jwtDecode(token);
    let userId = decodedToken["preferred_username"];
    // userId = "adam@gmail.com"
    // console.log(userId);
    console.log('Got body:', req.body);
    let dbo = mongodb.db(dbName);
    myobj = req.body;
    myobj["userId"] = userId
    // let userId = reqObj["userId"];
    // let clipData = reqObj["clipboardText"]
    // let dbo = mongodb.db(dbName);
    // myobj = reqObj;
    dbo.collection("clips").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        io.sockets.in("room-"+userId).emit("newData", myobj);      
    });
    res.send(200);
});

app.get('/clips/:userId', keycloak.protect(), function(req, res) {

    // let token = req.headers.authorization.split("Bearer")[1].trim();
    // let decodedToken = jwtDecode(token);

    // let userId = decodedToken["preferred_username"];
    userId = req.params["userId"];
    console.log("clips api: ", userId);
    // main_result = {};
    let dbo = mongodb.db(dbName);
    let query = {userId: userId};
    dbo.collection("clips").find(query).toArray(function(err, result) {
      if (err) throw err;
    //   main_result = result;
      res.send(result);
    });
});

// app.route('/deleteClip').delete(function(req, res) {
//     console.log('Got body DELETE:', req.body);
//     let result = {};
//     let dbo = mongodb.db(dbName);
//     id = req.body._id;
//     console.log("Id to be deleted: "+id)
//     let myquery = { _id: new mongodb.ObjectID(id) };
//     dbo.collection("clips").deleteOne(myquery, function(err, res) {
//         if (err) throw err;
//         result["success"] = true
//         result["message"] = "Successfully deleted the document"
//         res.status(200);
//         res.send(result);
//     });
    
// });

// let socketController = new SocketController();

io.on('connection', function(socket) {  
    // console.log('Desktop Client connected...');
    // socket.emit('message','you are connected');
    socket.on("join", function(reqObj) {
        if("token" in reqObj) {
            let {token} = reqObj;
            // token = "a";
            const options = {
                method: 'GET',
                url: 'https://copa-keycloak.herokuapp.com/auth/realms/copa/protocol/openid-connect/userinfo',
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
    // socket.on('desktopClient',function(reqObj){
    //     let userId = reqObj["userId"];
    //     console.log("user id:", userId);
    //     let clipData = reqObj["clipboardText"]
    //     let dbo = mongodb.db(dbName);
    //     myobj = reqObj;
    //     dbo.collection("clips").insertOne(myobj, function(err, res) {
    //         if (err) throw err;
    //         // console.log(res);
    //         console.log("1 document inserted");      
    //         // console.log("socket info: ", io.sockets.manager.roomClients[socket.id]);
    //         io.sockets.in("room-"+userId).emit("newData", myobj);      
    //     });
    //     //   socket.to('mobileClient').emit(clipData,'From Desktop');
    // });
    
    // socket.on('mobileClient',function(reqObj){
    //     let userId = reqObj["userId"];
    //     let clipData = reqObj["clipboardText"]
    //     let dbo = mongodb.db(dbName);
    //     myobj = reqObj;
    //     dbo.collection("clips").insertOne(myobj, function(err, res) {
    //         if (err) throw err;
    //         console.log("1 document inserted");
    //         io.sockets.in("room-"+userId).emit("newData", myobj);           
    //     });
    //     // socket.emit('message','From Desktop');
    //     // socket.to(userId).emit("newData", clipData);
    // });
        
});

// server.listen(3000);
server.listen(PORT)
console.log('HTTP Server listening on: %s', PORT);
