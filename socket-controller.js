"use strict;"
class SocketController {
    constructor(mongodb) {
        this.mongodb = mongodb;
        console.log("mongo: ", mongodb);
    }
    joinCallback(reqObj) {
        let userId = reqObj["userId"];
        console.log("User joined: ",userId)
        socket.join("room-"+userId);
        // socket.emit('message','you are added to the room '+userId);
        console.log(io.sockets.adapter.rooms["room-"+userId]);
    }
    
    leaveCallback(reqObj) {
        let userId = reqObj["userId"];
        console.log("User left: ",userId)
        socket.leave("room-"+userId);
        socket.emit('message','you are removed from the room '+userId);
    }
    
    saveToDatabaseCallback(reqObj){
        let userId = reqObj["userId"];
        console.log("user id:", userId);
        let clipData = reqObj["clipboardText"]
        var dbo = this.mongodb.db(dbName);
        myobj = reqObj;
        dbo.collection("clips").insertOne(myobj, function(err, res) {
            if (err) throw err;
            // console.log(res);
            console.log("1 document inserted");      
            // console.log("socket info: ", io.sockets.manager.roomClients[socket.id]);
            io.sockets.in("room-"+userId).emit("newData", myobj);      
        });
        //   socket.to('mobileClient').emit(clipData,'From Desktop');
    }
}


module.exports = SocketController