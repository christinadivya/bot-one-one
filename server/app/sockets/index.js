var express = require('express');
var app = express();;
var fs = require('fs');
const path = require('path');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const async = require("async");
const cors = require('cors')

const map = require('lodash/map');
const each = require('lodash/forEach');
const size = require('lodash/size');
const filter = require('lodash/filter');
const unionBy = require('lodash/unionBy');
const _ = require('underscore');
const formidable = require('formidable');

const User = require('../../model/user');
const Chatrequest = require('../../model/chatrequest');
const Chatroom = require('../../model/chatroom');
const Message = require('../../model/message');

const ChatrequestController = require('../controller/chatrequest');
const ChatroomController = require('../controller/chatroom');
const MessageController = require('../controller/message');

const isAuthenticated = require('../routes/auth').authUser; //authenticate token

const multer = require('multer');
const bodyParser = require('body-parser');
const config = require('../../../config/configuration');
const moment = require("moment");


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))

const socketEvents = (io, app) => {
  app.use(bodyParser.json());
  app.use('/docs', function (req, res, next) {
    var input = req.url.split('/')[1];
    var fields = input.split('-');
    var date = fields[0];
      let dir2 = path.resolve(__dirname,'../../../../Fetch39Files/Fetch39doc/' + date + '/' + input)
      console.log(dir2)
      if (fs.existsSync(dir2)) {
        res.sendFile(path.resolve(__dirname,'../../../../Fetch39Files/Fetch39doc/' + date + '/' + input))
      } else {
        res.sendFile(path.resolve(__dirname,'../../../../Fetch39Files/Fetch39doc/' + input))
      }
    

  });
  app.use('/thumbnail', function (req, res, next) {
    var input = req.url.split('/')[1];
    var fields = input.split('-');
    var date = fields[0];
    let dir = path.resolve(__dirname ,'../../../../Fetch39Files/Fetch39Thumbnail/' + date + '/' + input)
    if (fs.existsSync(dir)) {
      res.sendFile(path.resolve(__dirname ,'../../../../Fetch39Files/Fetch39Thumbnail/' + date + '/' + input))
    } else {
      res.sendFile(path.resolve(__dirname ,'../../../../Fetch39Files/Fetch39Thumbnail/' + input))

    }
  });

 
  app.use('/images', function (req, res, next) {
    var input = req.url.split('/')[1];
    var fields = input.split('-');
    var date = fields[0];
    console.log(fields,input,date)

    let dir = path.resolve(__dirname ,'../../../../Fetch39Files/Fetch39Image/' + date + '/' + input)
    if (fs.existsSync(dir)) {
      console.log(dir)
      res.sendFile(path.resolve(__dirname,'../../../../Fetch39Files/Fetch39Image/' + date + '/' + input))
    } else {
      console.log("q3333333333333333",dir)

      res.sendFile(path.resolve(__dirname,'../../../../Fetch39Files/Fetch39Image/' + input))

    }
  });
  app.use('/videos', function (req, res, next) {
    var input = req.url.split('/')[1];
    var fields = input.split('-');
    var date = fields[0];
    let dir2 = path.resolve(__dirname,'../../../../Fetch39Files/Fetch39video/' + date + '/' + input)
    console.log(dir2)
    if (fs.existsSync(dir2)) {
      res.sendFile(path.resolve(__dirname,'../../../../Fetch39Files/Fetch39video/' + date + '/' + input))
    } else {
      res.sendFile(path.resolve(__dirname,'../../../../Fetch39Files/Fetch39video/' + input))
    }
  });

  //Video Storage:
  var videoStorage = multer.diskStorage({
    destination: function (req, file, callback) {
      let date = moment().format("YYYYDDMM")
      let dir = path.resolve(__dirname,'../../../../Fetch39Files/Fetch39video/' + date);
      if (!fs.existsSync(dir)) {
        fs.mkdir(dir, err => {
        })
      }
      callback(null, path.resolve(__dirname, dir));
    },
    filename: function (req, file, callback) {
      let ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
      let orgName = file.originalname.substring(0, file.originalname.indexOf('.'));
      let uploadFileName = moment().format("YYYYDDMM") + '-' + Date.now() + '-' + orgName.split(' ').join('_') + ext;
      // let uploadFileName =Date.now() + '-' + orgName.split(' ').join('_') + ext;

      callback(null, uploadFileName)
    }
  });
  var uploadVideoFiles = multer({ storage: videoStorage }).array('file', 1);


  //Image Storage:
  var imageStorage = multer.diskStorage({
    destination: function (req, file, callback) {
      let date = moment().format("YYYYDDMM")
      let dir = path.resolve(__dirname, '../../../../Fetch39Files/Fetch39Image/' + date);
      if (!fs.existsSync(dir)) {
        fs.mkdir(dir, err => {
        })
      }
     callback(null, path.resolve(__dirname, dir));
    },
    filename: function (req, file, callback) {
      let ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
      let orgName = file.originalname.substring(0, file.originalname.indexOf('.'));
      let uploadFileName = moment().format("YYYYDDMM") + '-' + Date.now() + '-' + orgName.split(' ').join('_') + ext;
      callback(null, uploadFileName)
    }
  });
  var uploadImageFiles = multer({ storage: imageStorage }).array('file', 5);

  //Document Storage:
  var docStorage = multer.diskStorage({
    destination: function (req, file, callback) {
      let date = moment().format("YYYYDDMM")
      let dir = path.resolve(__dirname, '../../../../Fetch39Files/Fetch39doc/' + date);
      console.log(dir)
      if (!fs.existsSync(dir)) {
        fs.mkdir(dir, err => {
        })
      }
      callback(null, path.resolve(__dirname, dir));
    },
    filename: function (req, file, callback) {
      let ext = file.originalname.substring(file.originalname.lastIndexOf('-'), file.originalname.length);
      let ext1=ext.split('.')[1]
      let orgName = file.originalname.substring(0, file.originalname.indexOf('.'));
      console.log(ext1,"$$$$$$$$$$$",orgName,"@@@@@@@@@@",ext)
      let uploadFileName = moment().format("YYYYDDMM") + '-' + Date.now() + '-' + orgName.split(' ').join('_') +"_Fetch39."+ext1;
      callback(null, uploadFileName)
    }
  });
  var uploadDocFiles = multer({ storage: docStorage }).array('file', 10)
  
  var userIdArray = [];
  var nickname = [];
  var roomname = [];
  var groupname = [];
  var messages = [];
  var i = [];
  var x = [];
  var online_member = [];
  var temp1;
  var temp2;
  var socket_id;
  var socket_data;
  var files_array = [];
  var expiryTime = 8;
  var routineTime = 1;
  let onlineUsersInSocket=[]
  console.log("calledn index")

  io.on('connection', function (socket) {
    console.log("SOCKET CONNECTED!!!");
    socket.on('new-user', function (data, callback) {

      console.log("$$$$$$$$$$$$$$$ new user $$$$$$$$$$$$$$$$")
      console.log(data)
      if(data.userId != 0) {
      
      if (nickname[data.userId]) {
      } else {
        socket.userId = data.userId;
        onlineUsersInSocket.push(data.userId)
        // socket.username = data.username;
        // socket.userAvatar = data.userAvatar;
        // socket.join(data.userId);
        nickname[data.userId] = socket;
        // console.log("#######",nickname[data.username])
      }



      let userStatus = { status: "Online", online: true, userId: data.userId };
      socket.broadcast.emit('user-online-status', userStatus);
      callback({ success: true });
    }

    });

    //Send Chat request
    socket.on('send-chat-request', function (data, callback) {
      ChatrequestController.sendChatRequest({ data: data }, function (err, chatReqRes) {
        socket.emit("chat-request-response", { requestStatus: chatReqRes });
        socket.broadcast.emit('highlight-group-room', data);
        callback({ success: true });
      });
    });

    socket.on('join-user-chat', function (data, callback) {
      // moment.utc(new Date().toISOString().slice(0, 19).replace('T', ' ')).format("YYYY-MM-DDThh:mm:ss.SSS[Z]")
      console.log("USER ID CHECKING");
      console.log("%%%%, incoming");
      console.log(data)
      JSON.stringify(data);
      let room = data.senderId + "&" + data.receiverId + "&" + data.requestId;
      console.log(data.senderId);
      console.log(data.receiverId);
      console.log(data.requestId)
      // if (data.TCHAT_REQUEST_Status == "Accept") {
      let roomnames = room.split("&");
      let room1 = roomnames[0] + "&" + roomnames[1] + "&" + data.requestId;
      let room2 = roomnames[1] + "&" + roomnames[0] + "&" + data.requestId;
       ChatroomController.createChatRoom({ room: room, room1: room1, room2: room2 }, function (err, completeRoomCreation) {   //Create Chat Room
        
        let chatRoomData = completeRoomCreation[0];
        let chatRoomId = chatRoomData.HCHAT_ROOM_Chat_Room_ID;
        let roomUsersArr = [];
        socket.emit("get-room-id",{ success: true,chatRoomId:chatRoomId })
        console.log("join user callback &&&&&&&&&&&&&&&&&&*********************");
        console.log({ success: true,chatRoomId:chatRoomId} );

        callback({ success: true,chatRoomId:chatRoomId });
        let uniqueRoomName = chatRoomData.HCHAT_ROOM_Name; //room
          socket.join(uniqueRoomName);
            socket.roomname = uniqueRoomName;
           
          roomname[socket.roomname] = socket;
          roomUsersArr.push(data.senderId);
          roomUsersArr.push(data.receiverId);
         ChatroomController.createUserRoom({  data:data,roomUsers: roomUsersArr,roomUsersArr,chatRoomId:chatRoomId }, function (err, joinedRoomResp) {});
        let datas = { roomId:chatRoomId, userId:data.senderId, active: true }
        ChatroomController.updateActive(datas, function (err, msgResponse) { });
      });
      
    });
    //Accept or Reject chat request
    socket.on('reply-to-chat-request', function (data, callback) {
      // moment.utc(new Date().toISOString().slice(0, 19).replace('T', ' ')).format("YYYY-MM-DDThh:mm:ss.SSS[Z]")
      let room = data.senderId + "&" + data.receiverId;
      if (data.TCHAT_REQUEST_Status == "Accept") {
        let roomnames = room.split("&");
        let room1 = roomnames[0] + "&" + roomnames[1];
        let room2 = roomnames[1] + "&" + roomnames[0];

        ChatroomController.createChatRoom({ room: room, room1: room1, room2: room2 }, function (err, completeRoomCreation) {   //Create Chat Room
          ChatrequestController.UpdateChatRequestStatus({ data: data, roomData: completeRoomCreation }, function (err, chatReqRes) {
          });
          let chatRoomData = completeRoomCreation[0];
          let chatRoomId = chatRoomData.HCHAT_ROOM_Chat_Room_ID;
          let roomUsersArr = [];
          roomUsersArr.push(data.senderId);
          roomUsersArr.push(data.receiverId);
          ChatroomController.joinUserToChatRoom({ data: data, roomUsers: roomUsersArr, roomData: completeRoomCreation }, function (err, joinedRoomResp) {
            let uniqueRoomName = chatRoomData.HCHAT_ROOM_Name; //room
            socket.join(uniqueRoomName);
            socket.emit("1on1-room-name", { roomName: uniqueRoomName, chatRoomId: chatRoomId });
            console.log("+++++++++++++", data)
            socket.broadcast.emit('highlight-group-room', data)
            socket.roomname = uniqueRoomName;
            // callback({success:true});
            // }
            roomname[socket.roomname] = socket;
            callback({ success: true });
          });
        });
      } else {
        ChatrequestController.UpdateChatRequestStatus({ data: data, roomData: null }, function (err, chatReqRes) {
        });
        socket.emit("1on1-room-name", { roomName: null, chatRoomId: null, status: data.TCHAT_REQUEST_Status, data: data });
        socket.broadcast.emit('highlight-group-room', data)
        callback({ success: true });
      }
    });

    //PRIVATE CHAT

    //Join user to 1-1 chat room
    socket.on('join-1on1-room', function (data, callback) {

      ChatroomController.findChatRoom({ chatRoomId: data.chatRoomId }, function (err, chatRoomReponse) {
        let room = chatRoomReponse[0].HCHAT_ROOM_Name;
        socket.join(room);
        MessageController.updateMessageStatus(data, function (err, msgResponse) { });
       let  datas = { roomId: data.chatRoomId, userId: data.userId, active: true }
        console.log("!@@##$$$$$$$$$$$$$$$$$",datas)
        ChatroomController.updateActive(datas, function (err, msgResponse) { });
        socket.emit("1on1-room-name", { roomName: room, chatRoomId: data.chatRoomId ,userId:data.userId});
        socket.roomname = room;
        callback({ success: true });
        roomname[socket.roomname] = socket;
      });
    });
    // join user form my logs
    socket.on('join-chat', function(data, callback) {   
      
      socket.join(data.roomName);
      socket.emit("1on1-room-name", {roomName: data.roomName, chatRoomId: data.chatRoomId});
      socket.roomname = data.roomName;
      let roomData={roomName: data.roomName, chatRoomId: data.chatRoomId}
      callback({success:true,roomData});
    roomname[socket.roomname] = socket; 
       
});
     //update message read status for private chat
     socket.on('update-message-status', function (data, callback) {
      MessageController.updateMessageStatus(data, function (err, msgResponse) { });

      if (!data.isGroup) {

        io.sockets.to(data.roomname).emit('message-status-response', data);
      }
       
      callback({ success: true });
    });

    // update user active/inactive in private room
    socket.on('update-user-active-status', function (data, callback) {
console.log(data)
      ChatroomController.updateActive(data, function (err, msgResponse) { });
      callback({ success: true });
    });

    // delete message
    socket.on('delete-message', function (data, callback) {
console.log(data)
      MessageController.deleteMessage(data, function (err, msgResponse) {
data.chatRoomId=data.roomId
          socket.to(data.roomname).emit('new-message', data,msgResponse);
          socket.to(data.roomname).emit('highlight-room', data,msgResponse);
          messages.push(data);
          console.log(msgResponse)
          callback({ success: true,data });
      
      });

    });


    //send broadcast message
    socket.on('send-broadcast-message', function (data, callback) {
      console.log("############   send-broadcast-message ###############",data)
      let onlineMember = getOnlineUsers()
      // to get users in room 

      data.isbroadcast = false
      MessageController.createBroadcastMessage(onlineMember, data, function (err, msgResponse) {
        console.log("############   send-broadcast-message msgResponse msgResponse ",msgResponse)

        // MessageController.updateInstantReadStatus(data, function (error, msgUpdateResponse) {
        if (err == null) {
          data.messageId = msgResponse.TMESSAGES_Message_ID;
        }
        io.sockets.to(data.roomname).emit('new-message', data,msgResponse);
 
        // io.sockets.to(data.roomname).emit('highlight-room', data);
        socket.broadcast.emit('highlight-room', data,msgResponse);

        messages.push(data);
        callback({ success: true });

      });
      // });

    });


  // send new message
  socket.on('send-message', function (data, callback) {

    // console.log("$#$$$$$$$$$$$$$$$$$$$$$ sned message $$$$$$$$$$$$$$$$$$$$", data)
    // let onlineMember = getOnlineUsers()
    
    // data.isbroadcast = false
    // MessageController.createMessage(onlineMember, data, function (err, msgResponse) {

    //   MessageController.updateInstantReadStatus(data, function (error, msgUpdateResponse) {
    //     if (err == null) {
    //       data.messageId = msgResponse.TMESSAGES_Message_ID;
    //     }
    //     console.log("###33333333333333  new-message called  33333333333333####")

    //     socket.to(data.roomname).emit('new-message', data,msgResponse);
    //     // io.sockets.to(data.roomname).emit('highlight-room', data);
    //     // socket.broadcast.emit('highlight-room', data,msgResponse);
    //     socket.to(data.roomname).emit('highlight-room', data,msgResponse);

    //     messages.push(data);
    //     callback({ success: true });

    //   });
    // });
    let onlineMember = getOnlineUsers()
    console.log(data, "$#$$$$$$$$$$$$$$$$$$$$$ sned message $$$$$$$$$$$$$$$$$$$$ online users", onlineMember)


    MessageController.createMessage(onlineMember, data, function (err, msgResponse) {

      MessageController.updateInstantReadStatus(onlineMember, data, function (error, msgUpdateResponse,chatRoomData) {
        if (error == null) {
          data.messageId = msgResponse.TMESSAGES_Message_ID;
          msgResponse.TMESSAGES_Read_Status = msgUpdateResponse
          messages.push(data);
          console.log("@@@@@@@@@@@@@@@@@@!!!!!!!!!!!!!", msgResponse, msgUpdateResponse)
          socket.to(data.roomname).emit('new-message', data, msgResponse);

          callback({
            success: true,
            msgResponse
          });
        }

      })
      socket.to(data.roomname).emit('new-message', data, msgResponse);
      // socket.to(data.roomname).emit('highlight-room', data, msgResponse);
      socket.to(data.roomname).emit('highlight-room',data,msgResponse);


    });

  });

    // function getOnlineUsers() {

    //   var online_member = [];
    //   i = Object.keys(nickname);
    //   let z = 0
    //   for (var j = 0; j < i.length; j++) {
    //     z++;
    //     socket_id = i[j];
    //     // console.log("^^^^^^^^^^^^^^^",socket_id)
    //     socket_data = nickname[socket_id];

    //     temp1 = { "userId": socket_data.userId };
    //     online_member.push(temp1);
    //     if (z == i.length) {
    //       return online_member;
    //     }
    //   }
    // }

    function getOnlineUsers() {

      var online_member = [];
      i = Object.keys(nickname);
      let z = 0
      for (var j = 0; j < i.length; j++) {
        z++;
        socket_id = i[j];
        // console.log("^^^^^^^^^^^^^^^",socket_id)
        socket_data = nickname[socket_id];

        temp1 = {
          "userId": socket_data.userId
        };
        online_member.push(temp1);
        if (z == i.length) {
          return online_member;
        }
      }
    }


    // Forward message to single/multiple users
    socket.on('send-message-to-users', function (data, callback) {
      console.log("++++++++++++++++ send message to user +++++++++++++++++++++")
      //Get online users
      let onlineMember = getOnlineUsers();

      MessageController.sendMessageToUsers(onlineMember, data, function (err, msgResponse) {
        if (err == null) {
          data.messageId = msgResponse.TMESSAGES_Message_ID;
        }

        _.forEach(data.users, function (receiver) {

          let datas = {
            chatRoomId: receiver.chatRoomId,
            hasMsg: data.hasMsg,
            roomname: receiver.roomname,
            msgTime: data.msgtime,
            isGroup: data.isGroup,
            userId: data.userId,
            // username: data.username,
            msg: data.msg,
             istype: data.istype,
             dazzId:data.dazzId,
            filename: data.filename,
            messageId: data.messageId
          }
          if(datas.istype!="text"){
            datas.hasfile=true
          }
          io.sockets.to(receiver.roomname).emit('new-message', datas,msgResponse);
          socket.broadcast.emit('highlight-room', datas,msgResponse);

          messages.push(datas);
          callback({ success: true,data:data });

        });
      });
    });

    socket.on('get-messages-by-roomname', function (data) {
      var roommessages = [];
      if (messages && messages.length > 0) {
        for (var i = 0; i < messages.length; i++) {
          if (messages[i].roomname == data.roomname) {
            roommessages.push(messages[i]);
          }
        }
      }
      io.sockets.to(data.roomname).emit('get-messages-by-roomname-response', roommessages);
    })

    // Typing status
    socket.on('user-typing', function (data, callback) {
      socket.broadcast.to(data.roomname).emit('user-typing-response', data);
      callback({ success: true });
    })

    socket.on('user-stop-typing', function (data) {
      socket.broadcast.to(data.roomname).emit('user-stop-typing-response', data);
    })

    // sending 1on1 online members list
    socket.on('get-1on1-online-members', function (data) {
      var online_member = [];
      i = Object.keys(nickname);
      if (data && data.roomname) {
        var usersname = data.roomname.split("&&");
        for (var j = 0; j < i.length; j++) {
          socket_id = i[j];
          socket_data = nickname[socket_id];
          if (usersname[0] == socket_data.userId || usersname[1] == socket_data.userId) {
            temp1 = { "userId": socket_data.userId };
            online_member.push(temp1);
          }
        }
        io.sockets.emit('1on1-online-members', online_member);
      }
    });

    // sending online members list
    socket.on('get-online-members', function (data, callback) {
      var online_member = [];
      i = Object.keys(nickname);
      for (var j = 0; j < i.length; j++) {
        socket_id = i[j];
        socket_data = nickname[socket_id];
        temp1 = { "userId": socket_data.userId };
        online_member.push(temp1);
      }
      io.sockets.emit('online-members', online_member);
      callback({ success: true });
    });
    socket.on('disconnect', function (data) {
      // socket.emit('disconnected');
      // online = online - 1;


  });
    //Check user online status
    socket.on('get-user-online-status', function (data, callback) {
      let userId = data.userId;
      // let onlineMember = getOnlineUsers();
      // let checkUserOnline = _.forEach(onlineMember, function (result) {
      //    return result
      // }) 
      //  let isUserOffline = _.isEmpty(checkUserOnline);

       let isUserOffline ;
       _.forEach(onlineUsersInSocket, function (result) {
       console.log(result)
        if(parseInt(userId)===parseInt(result)){
          isUserOffline= result
       }
      })
      let userStatus;
      if (!isUserOffline) {
        userStatus = { status: "Offline", online: false, userId: data.userId };
      } else {
        userStatus = { status: "Online", online: true, userId: data.userId };
      }
console.log(userStatus,"#############",isUserOffline)
      io.sockets.emit('user-online-status', userStatus);
      callback({ success: true ,userStatus});
    });

    socket.on('disconnect-mannual', function (data) {
      console.log("@@@@@@@@@@@@@@@ socket diconnected @@@@@@@@@@", data)

      userStatus = { status: "Offline", online: false, userId: data.userId }
      io.sockets.emit('user-online-status', userStatus);
       
      for(var i = onlineUsersInSocket.length - 1; i >= 0; i--) {
        if(onlineUsersInSocket[i] === data.userId) {
          onlineUsersInSocket.splice(i, 1);
        }
    }
      delete onlineUsersInSocket[data.userId]
      delete nickname[data.userId];
    
      // callback({ success: true });
    });


    //  create Broadcast group
    socket.on('create-broadcast', function (data, callback) {

      let roomUsersCount = _.size((data.users));
      if (roomUsersCount <= 100) {
        ChatroomController.createbroadcast(data, function (err, chatGroupResponse) {
          console.log(chatGroupResponse.HCHAT_ROOM_Chat_Room_ID)

          if (err == null) {
console.log("%%%%%%%%% 123 %%%%%%%%",chatGroupResponse)
// let chatGroupResponse=JSON.parse(JSON.stringify(chatGroupResponse))
            let groupOpData = {
              success: true,
              groupDetails: chatGroupResponse[0],
              roomId: chatGroupResponse.HCHAT_ROOM_Chat_Room_ID,
              roomName: chatGroupResponse.HCHAT_ROOM_Name
            };
            callback({success:true,groupOpData});
            let roomUsers = _.forEach(data.users, function (roomUsers) {
              return roomUsers.userId
            })
            socket.groupname = data.groupname;
            socket.users = roomUsers;
            groupname[data.groupname] = socket;
            socket.join(data.groupname);
            // io.sockets.to(data.groupname).emit('highlight-group-room', data); 
            // socket.broadcast.emit('highlight-group-room', data);
            socket.broadcast.emit('highlight-room', data);
            // }
          } else {
            callback({ success: true, message: "Group name already exists"});
          }
        });
      } else {
        callback({ success: true, message: "Max limit exceeded" });
        socket.emit("group-limit-response", { data: "Max limit exceeded" });
      }
    });



    //CHAT GROUP:     

    //create group
    socket.on('create-group', function (data, callback) {

      data.broadcast = false
      let roomUsersCount = _.size((data.users));
      if (roomUsersCount <= 100) {
        ChatroomController.createGroupChatRoom(data, function (err, chatGroupResponse) {
console.log(chatGroupResponse,"$$$$$$$$$$$$$$$$$$$$$$$$$ 2222222222222 $$$$$$$$")
          if (err == null) {
            let roomUserIds = _.map(data.users, 'userId');
            data['isGroup'] = true;
            data['createLogs'] = true;
            data['addUsers']= true;
            data['createGroup']= true;

            
            data.chatRoomId=chatGroupResponse.HCHAT_ROOM_Chat_Room_ID,
            data.messageId=chatGroupResponse
            ChatroomController.joinUserToChatRoom({ data: data, roomUsers: roomUserIds, roomData: chatGroupResponse }, function (err, joinedRoomResponse) {
              let groupData = {
                groupDetails: chatGroupResponse,
               roomId: chatGroupResponse.HCHAT_ROOM_Chat_Room_ID,
               roomName: chatGroupResponse.HCHAT_ROOM_Name
             };
             callback({ success: true,groupData});
            });
            socket.groupname = data.groupname;
            socket.users = data.users;
            groupname[data.groupname] = socket;
            socket.join(data.groupname);
            io.sockets.to(data.groupname).emit('highlight-group-room', data); 
             socket.broadcast.emit('highlight-room', data);
            // }
          } else {
            callback({ success: true, message: "Group name already exists", roomId: chatGroupResponse[0].HCHAT_ROOM_Chat_Room_ID });
          }
        });
      } else {
        callback({ success: true, message: "Max limit exceeded" });
        socket.emit("group-limit-response", { data: "Max limit exceeded" });
      }
    });



    //delete group:
    socket.on('delete-group', function (data, callback) {
      // ChatroomController.deleteGroup(data, function ( err, chatRoomReponse) {
      console.log("************************ delete group**************************")
      console.log(data)
      //  io.sockets.to(data.roomname).emit('delete-group-response', data); 
      socket.emit('highlight-room', data);
      //  socket.broadcast.emit('highlight-group-room', data)
      //    socket.to(data.roomname).emit('delete-group-response',data);
      //  socket.broadcast.emit('highlight-group-room', data);
      callback({ success: true });
      // });
    });

    //add members to group
    socket.on('add-group-members', function (data, callback) {
      // ChatroomController.findChatRoom({ chatRoomId: data.chatRoomId }, function (err, chatGroupResponse) {
        ChatroomController.fineMyName(data, function (err, resp) { 
          ChatroomController.getUserNames(data, function (err,username) { 
         let roomUserIds = _.map(data.users, 'userId');
        data['isGroup'] = true;
        data['createLogs'] = false;
        data['addUsers'] = true;
        data['creator_name']=resp
        data['username']=username
        ChatroomController.addMembers({ data: data }, function (err, joinedRoomResponse) {
          callback({ success: true });
          // io.sockets.to(data.groupname).emit('highlight-group-room', data); 
          // socket.broadcast.emit('highlight-group-room', data);
          socket.broadcast.emit('highlight-room', data);
        });

        socket.groupname = data.groupname;
        let result = unionBy(data.users, socket.users, "userId");
        socket.users = result;
        groupname[data.groupname] = socket;
        socket.join(data.groupname);
        

      // });
    });
  })
  })

    //remove members to group
    socket.on('remove-group-members', function (data, callback) {
      console.log(data)
      // to get username

      ChatroomController.fineMyName(data, function (err, resp) { 

      
console.log("#############################",resp)
      _.forEach(data.users, function (user) {

        let exitdata = {
          username:resp,
          groupname: data.groupname,
          chatRoomId: data.chatRoomId,
          userId:data.creatorId,
          user: user,
          leftType: "remove",
          // TMESSAGES_Mobile_dateTime:data.TMESSAGES_Mobile_dateTime

        };
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$",exitdata)
        ChatroomController.exitGroupChatRoom(exitdata, function (err, resp) { });
      });
if(socket.users){

  filteredRoomUser = removeDuplicatesUsers(data.users, socket.users);
  socket.users = filteredRoomUser;
}
      callback({ success: true });
    });
  });

    //exit chat group
    socket.on('exit-group', function (data, callback) {
      let exitdata = {
        groupname: data.groupname,
        chatRoomId: data.chatRoomId,
        userId:data.userId,
        user: { "userId": data.userId},
        leftType: "left",
 
      };
      ChatroomController.exitGroupChatRoom(exitdata, function (err, resp) {
        console.log("!!!!!!!!!!!!!!!!!!!",resp)
       });
      console.log("socket user %%%%%%%%%%%%",socket.users)
      let filteredRoomUser = _.filter(socket.users, function (roomUserObj) {
         // if (roomUserObj.userId != data.user.userId) {
        //   return roomUserObj;
        // }
      });
      // socket.users = filteredRoomUser;
      callback({ success: true });
    });

    socket.on('get-group', function (data) {
      var groups = [];
      i = Object.keys(groupname);
      for (var j = 0; j < i.length; j++) {
        socket_id = i[j];
        socket_data = groupname[socket_id];

        temp2 = { "groupname": socket_data.groupname, "users": socket_data.users };
        groups.push(temp2);

      }
      io.sockets.emit('online-group', groups);
    });

    socket.on('join-group', function (data, callback) {
      socket.join(data.groupname);
      callback({ success: true });
    });

    socket.on('update group', function (data, callback) {
      if (groupname[data.groupname]) {
        callback({ success: true });
        groupname[data.groupname] = data;
      } else {
        callback({ success: false });
      }
    });

    socket.on('get-group-byname', function (data, callback) {
      socket_data = groupname[data.groupname];
      temp2 = { "groupname": socket_data.groupname, "users": socket_data.users };
      io.sockets.to(data.groupname).emit('get-group-byname-response', temp2);
      callback({ success: true });
    });


    socket.on('create 1on1 room', function (room, callback) {
      var roomnames = room.split("-");
      var room1 = roomnames[0] + "-" + roomnames[1];
      var room2 = roomnames[1] + "-" + roomnames[0];
      if (roomname[room1]) {
        socket.join(room1);
        socket.emit("1on1-room-name", room1);
        socket.roomname = room1;
        callback({ success: true });
      } else if (roomname[room2]) {
        socket.join(room2);
        socket.emit("1on1-room-name", room2);
        socket.roomname = room2;
        callback({ success: true });
      } else {
        socket.join(room);
        socket.emit("1on1-room-name", room);
        socket.roomname = room;
        callback({ success: true });
      }
      roomname[socket.roomname] = socket;
    });


    //CHAT DOCUMENTS UPLOAD:


    // Document upload  ///node/ConverseChatAPI/iisserver.js/chat/uploadDoc
    // app.post('/node/ConverseChatAPI/iisserver.js/chat/uploadDoc', isAuthenticated, function (req, res){
    app.post('/chat/uploadDoc', function (req, res) {
      
      let filesArray = [];
      uploadDocFiles(req, res, function (err) { 
        if (err) {
          console.log("%%%%%%%",err)
        }
          let fileLength = Object.keys(req.files).length;
        if (fileLength > 0) {
          if (err) {
            let errorMsg;
            if (err.code == "LIMIT_UNEXPECTED_FILE") {
              errorMsg = "Maximum limit exceeded";
            } else {
              errorMsg = "Error uploading file.";
            }
            res.setHeader("statusCode", 400);
            res.status(400).json({
              status: "Failed",
              statusCode: 400,
              data: errorMsg
            });
          } else {
            let responseBody = req.body;
            let onlineMember = getOnlineUsers(); //Get online users
            let i = 0;
            let f = 0;
            _.forEach(req.files, function (file) {
              console.log(file)

              f++;
              let data = {
                roomname: responseBody.roomname,
                // username: responseBody.username,
                // userAvatar: responseBody.userAvatar,
                hasFile: responseBody.hasFile,
                msgTime: responseBody.msgTime,
                istype: responseBody.istype,
                isGroup: responseBody.isGroup,
                userId: responseBody.userId,
                chatRoomId: parseInt(responseBody.chatRoomId),
                isDocFile: true,
                filename: file.originalname,
                size: bytesToSize(file.size),
                extension: path.extname(file.path),
                msg: config.authUrl + "/docs/" + file.filename,
                i: f,
                totCount: req.files.length,
                multifiles: true,
                isReply:responseBody.isReply,
                messageContant:responseBody.messageContant,
                messageId:responseBody.messageId,
                reply_file_type:responseBody.reply_file_type
              };
              let pdf_file = {
                filename: file.name,
                filetype: responseBody.istype
              };
              console.log(data);
              let input = data;

              MessageController.sendFilesToChat(onlineMember, file, data, function (err, msgResponse) {
                i++;
                data["TMESSAGES_Message_ID"] = msgResponse.TMESSAGES_Message_ID;
                files_array.push(pdf_file);
                filesArray.push(data);
                // io.sockets.to(data.roomname).emit('new-message-PDF', filesArray);
                io.sockets.to(data.roomname).emit('new-message', data,msgResponse);

                socket.broadcast.emit('highlight-room', data);
                MessageController.updateInstantReadStatus(onlineMember, input, function (error, msgUpdateResponse,chatRoomData) {


                  // io.sockets.to(data.roomname).emit('new-message-PDF', filesArray);
                  // io.sockets.to(data.roomname).emit('new-message', input, msgResponse);
                  // socket.broadcast.emit('highlight-room', input);
                  _.forEach(chatRoomData, function (roomUser) {
                    if (roomUser['chatRoomData.DUSER_ROOM_UID'] != data.userId && nickname[roomUser['chatRoomData.DUSER_ROOM_UID']]) {
                       let socketId = nickname[roomUser['chatRoomData.DUSER_ROOM_UID']].socketId
                      console.log(socketId)
                      msgResponse.TMESSAGES_Read_Status = msgUpdateResponse
                      socket.broadcast.to(socketId).emit('new-message', data, msgResponse)
                      socket.broadcast.to(socketId).emit('highlight-room', data)
      
                    }
                  })

                  // socket.to(data.roomname).emit('new-message', data, msgResponse);
                  // socket.to(data.roomname).emit('highlight-room', data, msgResponse);

                })
                // Chatroom.findAll({
                //   where: {
                //     HCHAT_ROOM_Chat_Room_ID: input.chatRoomId,
                //     HCHAT_ROOM_Is_Broadcast: true
                //   },
                //   include: [{
                //     model: Userroom,
                //     as: 'chatRoomData'
                //   }],
                //   raw: true
                // }).then((chatRoomRes) => {
                //   if (chatRoomRes.length > 0) {
                //     highlightBroadcast(chatRoomRes, input, msgResponse)


                //   }
                // })

                if (i == fileLength) {
                  // MessageController.updatePreviousLogAndCreateData(data, function (err, msgResponse) {
                  // });
                  res.setHeader("statusCode", 200);
                  res.status(200).json({
                    status: "Success",
                    statusCode: 200,
                    data: filesArray
                  });
                }
              });
            });
          }
        } else {
          res.setHeader("statusCode", 400);
          res.status(400).json({
            status: "Failed",
            statusCode: 400,
            data: "Document required"
          })
        }
      });

    });

    //Video upload  ///node/ConverseChatAPI/iisserver.js/chat/uploadVideo
    app.post('/chat/uploadVideo', function (req, res) {
      let date = moment().format("YYYYDDMM");
      let dir = path.resolve(__dirname, ' ../../../../DeelChatFiles/Deelachatvideo/' + date);
      if (!fs.existsSync(dir)) {
        fs.mkdir(dir, err => {
        })
      }
      uploadVideoFiles(req, res, function (err) {
        if (Object.keys(req.files).length > 0) {
          if (err) {
            let errorMsg;
            if (err.code == "LIMIT_UNEXPECTED_FILE") {
              errorMsg = "Maximum limit exceeded";
            } else {
              errorMsg = "Error uploading file.";
            }
            res.setHeader("statusCode", 400);
            res.status(400).json({
              status: "Failed",
              statusCode: 400,
              data: errorMsg
            });
          } else {
            let responseBody = req.body;
            let onlineMember = getOnlineUsers(); //Get online users

            _.forEach(req.files, function (file) {
              let data = {
                roomname: responseBody.roomname,
                // username: responseBody.username,
                // userAvatar: responseBody.userAvatar,
                hasFile: responseBody.hasFile,
                msgTime: responseBody.msgTime,
                istype: responseBody.istype,
                isGroup: responseBody.isGroup,
                userId: responseBody.userId,
                chatRoomId: parseInt(responseBody.chatRoomId),
                isVideoFile: true,
                filename: file.originalname,
                size: bytesToSize(file.size),
                extension: path.extname(file.path),
                msg: config.authUrl + "/videos/" + file.filename,
                isReply:responseBody.isReply,
                messageContant:responseBody.messageContant,
                messageId:responseBody.messageId,
                reply_file_type:responseBody.reply_file_type
              };
              let video_file = {
                filename: file.name,
                filetype: responseBody.istype
              };
              MessageController.sendFilesToChat(onlineMember, file, data, function (err, msgResponse) {
                data["TMESSAGES_Message_ID"] = msgResponse.TMESSAGES_Message_ID;
                files_array.push(video_file);
                messages.push(data);
                // io.sockets.to(data.roomname).emit('new-message-video', data);
                io.sockets.to(data.roomname).emit('new-message', data,msgResponse);
                socket.broadcast.emit('highlight-room', data);
                res.setHeader("statusCode", 200);
                res.status(200).json({
                  status: "Success",
                  statusCode: 200,
                  data: data
                })
              });
            });
          }
        } else {
          res.setHeader("statusCode", 400);
          res.status(400).json({
            status: "Failed",
            statusCode: 400,
            data: "Video required"
          })
        }
      });
    });

    app.post('/chat/uploadImage', function (req, res, next) {
      let bodyresponse = {}
      console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")

      let date = moment().format("YYYYDDMM");
      let dir = path.resolve(__dirname, '../../../../Fetch39Files/Fetch39Image/' + date);
      if (!fs.existsSync(dir)) {

        fs.mkdir(dir, err => {
        })
      }
      uploadImageFiles(req, res, function (err) {
        if (err) {
          console.log(err)
        }
        let fileLength

        fileLength = Object.keys(req.files).length;

        console.log(req.body, req.files)

        let filesArray = [];

        if (fileLength > 0) {
          if (err) {
            let errorMsg;
            if (err.code == "LIMIT_UNEXPECTED_FILE") {
              errorMsg = "Maximum limit exceeded";
            } else {
              errorMsg = "Error uploading file.";
            }
            res.setHeader("statusCode", 400);
            res.status(400).json({
              status: "Failed",
              statusCode: 400,
              data: errorMsg
            });
          } else {

            let responseBody = req.body;
            let onlineMember = getOnlineUsers(); //Get online users
            let i = 0;
            let f = 0;
            _.forEach(req.files, function (file) {
              f++;
              let data = {
                roomname: responseBody.roomname,
                // username: responseBody.username,
                // userAvatar: responseBody.userAvatar,
                hasFile: responseBody.hasFile,
                msgTime: responseBody.msgTime,
                istype: responseBody.istype,
                isGroup: responseBody.isGroup,
                userId: responseBody.userId,
                chatRoomId: parseInt(responseBody.chatRoomId),
                isImageFile: true,
                filename: file.originalname,
                size: bytesToSize(file.size),
                extension: path.extname(file.path),
                msg: config.authUrl + "/images/" + file.filename,
                i: f,
                totCount: req.files.length,
                multifiles: true,
                isReply:responseBody.isReply,
                messageContant:responseBody.messageContant,
                messageId:responseBody.messageId,
                reply_file_type:responseBody.reply_file_type
              };
              let image_file = {
                filename: file.name,
                filetype: responseBody.istype
              };
              let input = data;
              MessageController.sendFilesToChat(onlineMember, file, data, function (err, msgResponse) {

                i++;
                data["TMESSAGES_Message_ID"] = msgResponse.TMESSAGES_Message_ID;
                files_array.push(image_file);
                filesArray.push(data);
                // io.sockets.to(data.roomname).emit('new-message-image', filesArray);
                socket.broadcast.emit('new-message', data,msgResponse);
                socket.broadcast.emit('highlight-room', data,msgResponse);
                MessageController.updateInstantReadStatus(onlineMember, input, function (error, msgUpdateResponse,chatRoomData) {
                  // io.sockets.to(data.roomname).emit('new-message-image', filesArray);
                  // socket.broadcast.emit('new-message', input, msgResponse);
                  // socket.broadcast.emit('highlight-room', input, msgResponse);
                  _.forEach(chatRoomData, function (roomUser) {
                    if (roomUser['chatRoomData.DUSER_ROOM_UID'] != data.userId && nickname[roomUser['chatRoomData.DUSER_ROOM_UID']]) {
                       let socketId = nickname[roomUser['chatRoomData.DUSER_ROOM_UID']].socketId
                      console.log(socketId)
                      msgResponse.TMESSAGES_Read_Status = msgUpdateResponse
                      socket.broadcast.to(socketId).emit('new-message', data, msgResponse)
                      socket.broadcast.to(socketId).emit('highlight-room', data)
      
                    }
                  })

                  // socket.to(data.roomname).emit('new-message', data, msgResponse);
                  // socket.to(data.roomname).emit('highlight-room', data, msgResponse);

                })
                // Chatroom.findAll({
                //   where: {
                //     HCHAT_ROOM_Chat_Room_ID: input.chatRoomId,
                //     HCHAT_ROOM_Is_Broadcast: true
                //   },
                //   include: [{
                //     model: Userroom,
                //     as: 'chatRoomData'
                //   }],
                //   raw: true
                // }).then((chatRoomRes) => {
                //   if (chatRoomRes.length > 0) {
                //     highlightBroadcast(chatRoomRes, input, msgResponse)


                //   }
                // })

                if (i == fileLength) {

                  // MessageController.updatePreviousLogAndCreateData(data, function (err, msgResponse) {
                  // });
                  res.setHeader("statusCode", 200);
                  res.status(200).json({
                    status: "Success",
                    statusCode: 200,
                    data: filesArray
                  });
                }
              });
            });
          }
        } else {
          res.setHeader("statusCode", 400);
          res.status(400).json({
            status: "Failed",
            statusCode: 400,
            data: "Image requiredssss"
          })
        }
      });
    });

    // app.post('/chat/uploadImage', function (req, res, next) {
    //   let bodyresponse = {}
    //   let date = moment().format("YYYYDDMM");
    //   // let dir = path.resolve(__dirname, '../../../../../DeelChatFiles/DeelachatImage/' + date);
    //   // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%", dir)
    //   // if (!fs.existsSync(dir)) {

    //   //   fs.mkdir(dir, err => {
    //   //   })
    //   // }
    //   uploadImageFiles(req, res, function (err, message) {
    //     if (err) {
    //       console.log(err)
    //     }
    //     let fileLength

    //     fileLength = Object.keys(req.files).length;

    //     console.log(req.body, req.files)

    //     let filesArray = [];

    //     if (fileLength > 0) {
    //       if (err) {
    //         let errorMsg;
    //         if (err.code == "LIMIT_UNEXPECTED_FILE") {
    //           errorMsg = "Maximum limit exceeded";
    //         } else {
    //           errorMsg = "Error uploading file.";
    //         }
    //         res.setHeader("statusCode", 400);
    //         res.status(400).json({
    //           status: "Failed",
    //           statusCode: 400,
    //           data: errorMsg
    //         });
    //       } else {

    //         let responseBody = req.body;
    //         let onlineMember = getOnlineUsers(); //Get online users
    //         let i = 0;
    //         let f = 0;
    //         _.forEach(req.files, function (file) {
    //           f++;
    //           let data = {
    //             roomname: responseBody.roomname,
    //             // username: responseBody.username,
    //             // userAvatar: responseBody.userAvatar,
    //             hasFile: responseBody.hasFile,
    //             msgTime: responseBody.msgTime,
    //             istype: responseBody.istype,
    //             isGroup: responseBody.isGroup,
    //             userId: responseBody.userId,
    //             chatRoomId: parseInt(responseBody.chatRoomId),
    //             isImageFile: true,
    //             filename: file.originalname,
    //             size: bytesToSize(file.size),
    //             extension: path.extname(file.path),
    //             msg: config.authUrl + "/images/" + file.filename,
    //             i: f,
    //             totCount: req.files.length,
    //             multifiles: true,
    //             isReply: responseBody.isReply,
    //             messageContant: responseBody.messageContant,
    //             messageId: responseBody.messageId,
    //             reply_file_type: responseBody.reply_file_type,
    //             reply_thumbnail: responseBody.reply_thumbnail
    //           };
    //           let image_file = {
    //             filename: file.name,
    //             filetype: responseBody.istype
    //           };
    //           let input = data
    //           i++;
    //           console.log("^%%%%%%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%%%%%%%%%%%%%%%%")
    //           console.log(data)
    //           console.log(input)
    //           MessageController.sendFilesToChat(onlineMember, file, data, function (err, msgResponse) {
    //             data["TMESSAGES_Message_ID"] = msgResponse.TMESSAGES_Message_ID;
    //             files_array.push(image_file);
    //             filesArray.push(data);

    //             MessageController.updateInstantReadStatus(onlineMember, input, function (error, msgUpdateResponse,chatRoomData) {
    //               // io.sockets.to(data.roomname).emit('new-message-image', filesArray);
    //               // socket.broadcast.emit('new-message', input, msgResponse);
    //               // socket.broadcast.emit('highlight-room', input, msgResponse);
    //               _.forEach(chatRoomData, function (roomUser) {
    //                 if (roomUser['chatRoomData.DUSER_ROOM_UID'] != data.userId && nickname[roomUser['chatRoomData.DUSER_ROOM_UID']]) {
    //                    let socketId = nickname[roomUser['chatRoomData.DUSER_ROOM_UID']].socketId
    //                   console.log(socketId)
    //                   msgResponse.TMESSAGES_Read_Status = msgUpdateResponse
    //                   socket.broadcast.to(socketId).emit('new-message', data, msgResponse)
    //                   socket.broadcast.to(socketId).emit('highlight-room', data)
      
    //                 }
    //               })

    //               // socket.to(data.roomname).emit('new-message', data, msgResponse);
    //               // socket.to(data.roomname).emit('highlight-room', data, msgResponse);

    //             })
    //             Chatroom.findAll({
    //               where: {
    //                 HCHAT_ROOM_Chat_Room_ID: input.chatRoomId,
    //                 HCHAT_ROOM_Is_Broadcast: true
    //               },
    //               include: [{
    //                 model: Userroom,
    //                 as: 'chatRoomData'
    //               }],
    //               raw: true
    //             }).then((chatRoomRes) => {
    //               if (chatRoomRes.length > 0) {
    //                 highlightBroadcast(chatRoomRes, input, msgResponse)


    //               }
    //             })

    //             console.log(i, "$$$$$$$$$$$$$$$$$$$$$$$$$$$$", fileLength)
    //             if (i == fileLength) {

    //               // MessageController.updatePreviousLogAndCreateData(data, function (err, msgResponse) {
    //               // });
    //               res.setHeader("statusCode", 200);
    //               res.status(200).json({
    //                 status: "Success",
    //                 statusCode: 200,
    //                 data: filesArray
    //               });
    //             }
    //           });
    //         });
    //       }
    //     } else {
    //       res.setHeader("statusCode", 400);
    //       res.status(400).json({
    //         status: "Failed",
    //         statusCode: 400,
    //         Error: err,
    //         data: "Image required"
    //       })
    //     }
    //   });
    // });


    //Get chat uploaded files from local directory
    app.get("/node/ConverseChatAPI/iisserver.js/chat/uploads", function (req, res) {
      let folderPath;
      if (req.query.filetype == "image") {
        folderPath = "ChatImage";
      } else if (req.query.filetype == "PDF") {
        folderPath = "ChatDocs";
      } else if (req.query.filetype == "video") {
        folderPath = "ChatVideos";
      }
      let filePath = path.join(__dirname, "../../ConverseFiles/" + folderPath + "/" + req.query.filename);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
        // fs.readFile(filePath , function (err,data){
        //     res.contentType("application/pdf");
        //     res.send(data);
        // });
      }
      else {
        res.setHeader("statusCode", 400);
        res.status(400).json({
          status: "Failed",
          statusCode: 400,
          data: "File not found"
        })
      }
    });

    //image upload  ///node/ConverseChatAPI/iisserver.js/chat/uploadImage
    app.post('chat/uploadImage/OLD', function (req, res) {
      // var imgdatetimenow = Date.now();  
      var form = new formidable.IncomingForm({ keepExtensions: true });
      // form.on('end', function() { // res.end();
      // });
      form.parse(req, function (err, fields, files) {
        if (Object.keys(files).length > 0) {
          var data = {
            roomname: fields.roomname,
            // username: fields.username,
            // userAvatar: fields.userAvatar,
            hasFile: fields.hasFile,
            msgTime: fields.msgTime,
            istype: fields.istype,
            isGroup: fields.isGroup,
            userId: parseInt(fields.userId),
            chatRoomId: parseInt(fields.chatRoomId),
            isImageFile: true,
            filename: files.file.name,
            size: bytesToSize(files.file.size),
            token: fields.token,
            extension: path.extname(files.file.path)
          };
          var image_file = {
            filename: files.file.name,
            filetype: fields.istype
          };

          // let bitmap = fs.readFileSync(files.file.path);
          // let base64Image = new Buffer(bitmap, 'binary').toString('base64');
          // // let base64Image = files.file.toString('base64');
          // let imgSrcString = `data:image/${files.file.name.split('.').pop()};base64,${base64Image}`; application

          let imgSrcString = getByteArray(files.file.path);

          //Get online users
          let onlineMember = getOnlineUsers();

          MessageController.uploadFileToChat(onlineMember, files, data, imgSrcString, function (err, msgResponse) {
            if (msgResponse == "401 UNAUTHORIZED") {
              res.setHeader("statusCode", 400);
              res.status(400).json({
                status: "Failed",
                statusCode: 400,
                data: msgResponse
              })
            } else {
              let respMsg = msgResponse.data;
              if (msgResponse.upload != undefined && msgResponse.upload) {
                files_array.push(image_file);
                messages.push(respMsg);
                io.sockets.to(respMsg.roomname).emit('new-message-image', respMsg);

                res.setHeader("statusCode", 200);
                res.setHeader("token", respMsg.token);
                res.status(200).json({
                  status: "Success",
                  statusCode: 200,
                  data: respMsg
                })
              } else if (msgResponse.upload != undefined && !msgResponse.upload) {
                res.setHeader("statusCode", 400);
                res.status(400).json({
                  status: "Failed",
                  statusCode: 400,
                  data: respMsg
                })
              }
            }
          });
        } else {
          res.setHeader("statusCode", 400);
          res.status(400).json({
            status: "Failed",
            statusCode: 400,
            data: "Image required"
          })
        }
      });
    });

    // document upload  ///node/ConverseChatAPI/iisserver.js/chat/uploadDoc
    app.post('/chat/uploadDoc/OLD', function (req, res) {
      var form = new formidable.IncomingForm({ keepExtensions: true });
      form.parse(req, function (err, fields, files) {
        if (Object.keys(files).length > 0) {
          var data = {
            roomname: fields.roomname,
            // username: fields.username,
            // userAvatar: fields.userAvatar,
            hasFile: fields.hasFile,
            msgTime: fields.msgTime,
            istype: fields.istype,
            isGroup: fields.isGroup,
            userId: parseInt(fields.userId),
            chatRoomId: parseInt(fields.chatRoomId),
            isDocFile: true,
            filename: files.file.name,
            size: bytesToSize(files.file.size),
            token: fields.token,
            extension: path.extname(files.file.path)
          };
          var pdf_file = {
            filename: files.file.name,
            filetype: fields.istype
          };

          let imgSrcString = getByteArray(files.file.path);

          //Get online users
          let onlineMember = getOnlineUsers();

          MessageController.uploadFileToChat(onlineMember, files, data, imgSrcString, function (err, msgResponse) {
            if (msgResponse == "401 UNAUTHORIZED") {
              res.setHeader("statusCode", 400);
              res.status(400).json({
                status: "Failed",
                statusCode: 400,
                data: msgResponse
              })
            } else {
              let respMsg = msgResponse.data;

              if (msgResponse.upload != undefined && msgResponse.upload) {
                files_array.push(pdf_file);
                messages.push(respMsg);
                io.sockets.to(respMsg.roomname).emit('new-message-PDF', respMsg);

                res.setHeader("statusCode", 200);
                res.setHeader("token", respMsg.token);
                res.status(200).json({
                  status: "Success",
                  statusCode: 200,
                  data: respMsg
                })
              } else if (msgResponse.upload != undefined && !msgResponse.upload) {
                res.setHeader("statusCode", 400);
                res.status(400).json({
                  status: "Failed",
                  statusCode: 400,
                  data: respMsg
                })
              }
            }
          });
        } else {
          res.setHeader("statusCode", 400);
          res.status(400).json({
            status: "Failed",
            statusCode: 400,
            data: "Doc required"
          })
        }
      });
    });
  });



  // route for checking requested file , does exist on server or not
  app.post('/v1/getfile', function (req, res) {
    var data = req.body.dwid;
    var filenm = req.body.filename;
    var dwidexist = false;
    var req_file_data;

    for (var i = 0; i < files_array.length; i++) {
      if (files_array[i].dwid == data) {
        dwidexist = true;
        req_file_data = files_array[i];
      }
    }

    // CASE 1 : File Exists
    if (dwidexist == true) {
      //CASE 2 : File Expired and Deleted
      if (req_file_data.expirytime < Date.now()) {
        var deletedfileinfo = {
          isExpired: true,
          expmsg: "File has beed removed."
        };
        fs.unlink(req_file_data.serverfilepath, function (err) {
          if (err) {
            return console.error(err);
          }
          res.send(deletedfileinfo);
        });
        var index = files_array.indexOf(req_file_data);
        files_array.splice(index, 1);
      } else {
        // CASE 3 : File Exist and returned serverfilename in response
        var fileinfo = {
          isExpired: false,
          filename: req_file_data.filename,
          serverfilename: req_file_data.serverfilename
        };
        res.send(fileinfo);
      }
    } else {
      // CASE 4 : File Doesn't Exists.       
      var deletedfileinfo = {
        isExpired: true,
        expmsg: "File has beed removed."
      };
      res.send(deletedfileinfo);
    }
  });

  // Routine Clean up call
  setInterval(function () { routine_cleanup(); }, (3600000 * routineTime));

  // Size Conversion
  function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) return bytes + ' ' + sizes[i];
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };
  //get file name from server file path
  function baseName(str) {
    var base = new String(str).substring(str.lastIndexOf('/') + 1);
    return base;
  }

  // Routine cleanup function (files delete after specific interval)
  function routine_cleanup() {
    for (var i = 0; i < files_array.length; i++) {
      if (Date.now() > files_array[i].expirytime) {
        fs.unlink(files_array[i].serverfilepath, function (err) {
          if (err) {
            return console.error(err);
          }
        });
        files_array.splice(i, 1);
      }
    }
  };
};

function removeDuplicatesUsers(a, b) {
  for (var i = 0, len = a.length; i < len; i++) {
    for (var j = 0, len2 = b.length; j < len2; j++) {
      if (a[i].userId === b[j].userId) {
        b.splice(j, 1);
        len2 = b.length;
      }
    }
  }
  return b;
}

function getByteArray(filePath) {
  let fileData = fs.readFileSync(filePath).toString('hex');
  let result = []
  for (var i = 0; i < fileData.length; i += 2)
    result.push('0x' + fileData[i] + '' + fileData[i + 1])
  return result;
}

module.exports = socketEvents;

// route for uploading audio asynchronously
app.post('/v1/uploadAudio', function (req, res) {
  var userName, useravatar, hasfile, ismusicfile, isType, showMe, DWimgsrc, DWid, msgtime;
  var imgdatetimenow = Date.now();
  var form = new formidable.IncomingForm({
    uploadDir: __dirname + '/public/app/upload/music',
    keepExtensions: true
  });


  form.on('end', function () {
    res.end();
  });
  form.parse(req, function (err, fields, files) {
    console.log("files : ", files);
    console.log("fields : ", fields);
    var data = {
      roomname: fields.roomname,
      username: fields.username,
      userAvatar: fields.userAvatar,
      repeatMsg: true,
      hasFile: fields.hasFile,
      isMusicFile: fields.isMusicFile,
      istype: fields.istype,
      showme: fields.showme,
      dwimgsrc: fields.dwimgsrc,
      dwid: fields.dwid,
      serverfilename: baseName(files.file.path),
      msgTime: fields.msgTime,
      filename: files.file.name,
      size: bytesToSize(files.file.size)
    };
    var audio_file = {
      dwid: fields.dwid,
      filename: files.file.name,
      filetype: fields.istype,
      serverfilename: baseName(files.file.path),
      serverfilepath: files.file.path,
      expirytime: imgdatetimenow + (3600000 * expiryTime)
    };
    files_array.push(audio_file);
    messages.push(data);
    io.sockets.to(data.roomname).emit('new message music', data);
  });
});

