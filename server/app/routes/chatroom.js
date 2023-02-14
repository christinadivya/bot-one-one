const router = require('express').Router();
const Chatroom = require('../../model/chatroom');
const Message = require('../../model/message');
const User = require('../../model/user');
const Userroom = require('../../model/userroom');
const _ = require('underscore');
const Document = require('../../model/document');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const Chatlog = require('../../model/chatlog');
const Chatrequest = require('../../model/chatrequest');
const moment = require('moment');
var fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const configuration = require('../../../config/configuration');
const config = require('../../model/DB_connection')
const config_SQL = require('../../model/_db').db
const request = require('request');
const rp = require('request-promise');
const path = require('path');
const ChatroomController = require('../controller/chatroom')
const MessageRecord = require('../../model/messageRecord')
var jsonexport = require('jsonexport');
const pdfshift = require('pdfshift')('6c97440cc19d4959b5860c61463a00b2')
const Sync_contact = require('../../model/Sync_contact')
let mysql = require('mysql');

let connection = mysql.createConnection(config);
var mysqlCon = require('../../model/mySqlAPI');

mysqlCon.reconnect = function () {
  mysqlCon.connect().then(function (con) {
    console.log("connected. getting new reference");
    mysql = con;
    mysql.on('error', function (err, result) {
      mysqlAPI.reconnect();
    });
  }, function (error) {
    console.log("try again");
    setTimeout(mysqlAPI.reconnect, 2000);
  });
};

//Image Storage:
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())
var imageStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    let date = moment().format("YYYYDDMM")
    let dir = path.resolve(__dirname,'../../../../DeelChatFiles/DeelachatThumbnail/' + date);
    console.log("###########", dir)
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


// // update video thumbnail image
// router.put('/videoThumbnail', (req, res, next) => {
//   uploadImageFiles(req,res,function(err) {
//     let fileLength = Object.keys(req.files).length;
//     if(fileLength > 0){
//       if(err) {
//         let errorMsg;
//         if(err.code == "LIMIT_UNEXPECTED_FILE"){
//           errorMsg = "Maximum limit exceeded";
//         }else{
//           errorMsg = "Error uploading file.";
//         }
//         failureHandler(errorMsg, res);
//       }else{
//         let responseBody = req.body; 
//         _.forEach(req.files, function(file) {
//           Message.findAll({
//             where:{
//               TMESSAGES_Message_ID: req.body.messageId,
//               TMESSAGES_Chat_Room_ID: req.body.roomId
//             },
//             raw: true
//           })
//           .then((messageResp) => {
//             let thumbnailURL =  config.authUrl+"/images/"+ file.filename;
//             if(messageResp.length != 0){
//               Message.update({ TMESSAGES_Thumbnail_Url: thumbnailURL },{
//                 where: {
//                   TMESSAGES_Message_ID: req.body.messageId,
//                   TMESSAGES_Chat_Room_ID: req.body.roomId
//                 }
//               }).then((updatedRes) => {
//                 Document.update({ TDOCUMENTS_Thumbnail_Url: thumbnailURL },{
//                   where: {
//                     TDOCUMENTS_Document_ID: messageResp[0].TMESSAGES_Document_ID
//                   }
//                 }).then((updatedDocRes) => {   
//                   successHandler("Successfully uploaded", res);              
//                 });                
//               });
//             }
//           });
//         })
//       }
//     }else{
//       failureHandler("Image required", res);
//     }
//   });
// });

//video thumbnail for view a image in mobile end
router.put('/videoThumbnail', (req, res, next) => {

  uploadImageFiles(req, res, function (err) {

    let fileLength = Object.keys(req.files).length;
    if (fileLength > 0) {
      if (err) {
        let errorMsg;
        if (err.code == "LIMIT_UNEXPECTED_FILE") {
          errorMsg = "Maximum limit exceeded";
        } else {
          errorMsg = "Error uploading file.";
        }
        failureHandler(errorMsg, res);
      } else {

        let responseBody = req.body;
        _.forEach(req.files, function (file) {
          Message.findAll({
            where: {
              TMESSAGES_Message_ID: req.body.messageId,
              TMESSAGES_Chat_Room_ID: req.body.roomId
            },
            raw: true
          })
            .then((messageResp) => {


              let thumbnailURL = configuration.authUrl + "/thumbnail/" + file.filename;
              if (messageResp.length != 0) {

                Message.update({ TMESSAGES_Thumbnail_Url: thumbnailURL }, {
                  where: {
                    TMESSAGES_Message_ID: req.body.messageId,
                    TMESSAGES_Chat_Room_ID: req.body.roomId
                  }
                }).then((updatedRes) => {
                  MessageRecord.update({ TMESSAGES_Record_Read_Status: "sent" }, {
                    where: {
                      TMESSAGES_Record_Chat_Room_ID: req.body.roomId,
                      TMESSAGES_Record_Message_ID: req.body.messageId
                    },
                    raw: true
                  }).then((res) => { });

                  Document.update({ TDOCUMENTS_Thumbnail_Url: thumbnailURL }, {
                    where: {
                      TDOCUMENTS_Document_ID: messageResp[0].TMESSAGES_Document_ID
                    }
                  }).then((updatedDocRes) => {
                    console.log("@", updatedDocRes)
                    res.setHeader("statusCode", 200);
                    res.status(200).json({
                      status: "Success",
                      statusCode: 200,
                      Message: "Successfully uploaded",
                      URL: thumbnailURL
                    });
                  });
                });
              } else {
                failureHandler("Room and Message id doesn't match", res);

              }
            });
        })
      }
    } else {
      failureHandler("Image required", res);
    }
  });
});
router.post('/uploadGroupImage', (req, res, next) => {
  uploadImageFiles(req, res, function (err) {
    if (err) {
      console.log(err)
    }
    console.log(req.files)
    let fileLength
    fileLength = Object.keys(req.files).length;
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
        _.forEach(req.files, function (file) {
          Chatroom.update({ HCHAT_ROOM_Chat_Room_image: configuration.authUrl + "/thumbnail/" + file.filename }, {
            where: {
              HCHAT_ROOM_Chat_Room_ID: req.body.chatRoomId
            },
            raw: true

          }).then(response => {
            response
            res.setHeader("statusCode", 200);
            res.status(200).json({
              status: "Success",
              statusCode: 200,
              Message: "group icon updated",
              img: configuration.authUrl + "/thumbnail/" + file.filename
            });
          })
        });
      }
    } else {
      res.setHeader("statusCode", 400);
      res.status(400).json({
        status: "Failed",
        statusCode: 400,
        data: "Image required"
      })
    }
  });
})
// create room while sync
router.post('/sync_contacts', (req, res, next) => {
  //body users: {},

  let x = 0
  let count = 0
  var startLoop = function (arr) {

    console.log("startLoop called", count,arr[x])
    callFunction(arr[x], function () {
      console.log("function called", count,arr[x])
      count++
      x++;
      if (x < arr.length) {
        startLoop(arr);
      }

    });

  }
  startLoop(req.body.users)
  successHandler("Successfully updated", res);


});
//function call for update contact
function callFunction(user, callback) {
  let data = {
    room1: user.userId + "&" + user.appUser,
    room2: user.appUser + "&" + user.userId
  }
  Chatroom.findAll({
    where: {
      [Op.or]: [{ HCHAT_ROOM_Name: data.room1 }, { HCHAT_ROOM_Name: data.room2 }]
    },
    raw: true
  })
    .then((foundRoom) => {
      if (foundRoom.length == 0) {
        Chatroom.create({ HCHAT_ROOM_Name: data.room1 })
          .then((createdRoom) => {
            console.log(createdRoom.toJSON())
            let roomId = createdRoom.toJSON().HCHAT_ROOM_Chat_Room_ID
            Sync_contact.update({ chatRoomId: roomId }, {
              where: { userId: user.userId, appUser: user.appUser },
              raw: true

            }).then(res => {
              console.log(res)

              callback()
            })
          });
      } else {
        console.log("#######",foundRoom)

        let roomId = foundRoom[0].HCHAT_ROOM_Chat_Room_ID;
          Sync_contact.update({ chatRoomId: roomId }, {
            where: {
              userId: user.userId,
              appUser: user.appUser
            },
            raw: true
          }).then((updatedRes) => {
            console.log(updatedRes)
             callback()
            });

      }
    })
}

// update user active/inactive in private room
router.put('/updateActive', (req, res, next) => {

  Userroom.findAll({
    where: {
      DUSER_ROOM_UID: req.body.userId,
      DUSER_ROOM_Chat_Room_ID: req.body.roomId
    },
    raw: true
  })
    .then((userRoom) => {
      if (userRoom.length != 0) {
        Userroom.update({ DUSER_ROOM_Active: req.body.active }, {
          where: {
            DUSER_ROOM_UID: req.body.userId,
            DUSER_ROOM_Chat_Room_ID: req.body.roomId
          }
        })
          .then((updatedRes) => {
            successHandler("Successfully updated", res);
          });
      } else {
        failureHandler("Record Not found", res);
      }
    }).catch(next);
});

//update user archive history
router.put('/updateArchive', (req, res, next) => {

  Userroom.update({ DUSER_ROOM_Archive: req.body.isArchive }, {
    where: {
      DUSER_ROOM_UID: req.body.userId,
      DUSER_ROOM_Chat_Room_ID: req.body.roomId
    }
  }).then({})
  Chatlog.update({ TChat_Log_IS_Archive: req.body.isArchive }, {
    where: {
      TChat_Log_Sender: req.body.userId,
      TChat_Log_Chat_Room_ID: req.body.roomId
    }
  })
    .then((updatedRes) => {
      successHandler("Successfully updated", res);
    });
});

// list out archive
router.get('/ListArchive', (req, res, next) => {
  Chatlog.findAll({
    where: {
      TChat_Log_Sender: req.query.userId,
      TChat_Log_IS_Archive: true
    },
    include: [
      { model: User, as: 'senderUser', attributes: ['id', 'username'] },
      { model: User, as: 'receiverUser', attributes: ['id', 'username', ] },
      {
        model: Chatroom, as: 'chatRoomLogs', attributes: ['HCHAT_ROOM_Chat_Room_ID', 'HCHAT_ROOM_Name', 'HCHAT_ROOM_IS_Group', 'HCHAT_ROOM_IS_Delete', 'HCHAT_ROOMS_Created_On', "HCHAT_ROOMS_Updated_On", 'HCHAT_ROOMS_Message_ID'],
        include: [
          {
            model: Userroom, as: 'chatRoomData',
            include: [{ model: User, as: 'userRoomData', attributes: ['id', 'username'] }]
          }]
      }
    ],
  })
    .then((updatedRes) => {
      successHandler(updatedRes, res);
    });
});

//make admin systamatic 
router.put('/makeAdmin', (req, res, next) => {
  Userroom.update({ DUSER_ROOM_Role: "Admin" }, {
    where: {
      DUSER_ROOM_UID: req.body.userId,
      DUSER_ROOM_Chat_Room_ID: req.body.roomId
    }
  })
    .then((updatedRes) => {
      if (updatedRes[0] == 0) {
        successHandler("Aleardy Admin", res);

      } else {
        successHandler("Successfully updated", res);

      }
    });
});

//add group Description for group chat 
router.put('/updateGroupDetails', (req, res, next) => {
  console.log("updateGroupDetails", req.body)
  // HCHAT_ROOM_Description
  // HCHAT_ROOM_Name
  Chatroom.update(req.body, {
    where: {
      HCHAT_ROOM_Chat_Room_ID: req.query.roomId,
    },
    raw: true
  })
    .then((updatedRes) => {
      console.log(updatedRes)
      successHandler("Successfully updated", res);
    });
});

//Get room Images/Documents

router.get('/documents', (req, res, next) => {
  let roomId = req.query.roomId;
  let limit = parseInt(req.query.limit);
  let offset = 0;
  Document.findAndCountAll({
    where: {
      TDOCUMENTS_Chat_Room_ID: roomId,
      TDOCUMENTS_Document_Type: req.query.type,
      TDOCUMENTS_IS_Delete: false
    }
  })
    .then((data) => {
      let page = parseInt(req.query.page);
      let pages = Math.ceil(data.count / limit);
      offset = limit * (page - 1);
      Document.findAll({
        where: {
          TDOCUMENTS_Chat_Room_ID: roomId,
          TDOCUMENTS_Document_Type: req.query.type,
          TDOCUMENTS_IS_Delete: false
        },

        attributes: ['TDOCUMENTS_Document_ID', 'TDOCUMENTS_Document_Type', 'TDOCUMENTS_Document_Name', 'TDOCUMENTS_Created_On', 'TDOCUMENTS_Document_Path', 'TDOCUMENTS_Thumbnail_Url', 'TDOCUMENTS_IS_Delete'],
        order: [
          ['TDOCUMENTS_Created_On', 'DESC'],
        ],
        limit: limit,
        offset: offset
      })
        .then((foundMessages) => {

          if (foundMessages.length == 0) {
            res.setHeader("statusCode", 200);
            res.status(200).json({
              status: "Success",
              statusCode: 200,
              data: foundMessages,
              count: data.count,
              pages: pages
            });
          } else {
            let filterArr = foundMessages;
            let filterArrData = JSON.parse(JSON.stringify(filterArr));
            let itemsProcessed = 0;
            for (var i = 0; i < filterArrData.length; i++) {
              itemsProcessed++;
              let list = filterArrData[i];
              if (list.TDOCUMENTS_Document_Type == "PDF") {
                if (list.TDOCUMENTS_Document_Name != undefined && list.TDOCUMENTS_Document_Name != null) {


                  let splitName = list.TDOCUMENTS_Document_Name.split('-')[1];
                  if (splitName != undefined) {
                    list.TDOCUMENTS_Document_Name = splitName;
                  } else {
                    list.TDOCUMENTS_Document_Name = list.TDOCUMENTS_Document_Name;
                  }
                }
              }
              if (itemsProcessed === filterArrData.length) {
                res.setHeader("statusCode", 200);
                res.status(200).json({
                  status: "Success",
                  statusCode: 200,
                  data: filterArrData,
                  count: data.count,
                  pages: pages
                });
              }
            };
          }
        });
    })
    .catch(next);
});

// update room name
router.put('/updategroup', (req, res, next) => {
  Chatroom.findAll({
    where: {
      HCHAT_ROOM_Name: req.body.groupName
    },
    raw: true
  })
    .then((foundChatrooms) => {
      if (foundChatrooms.length == 0) {
        Chatroom.update({ HCHAT_ROOM_Name: req.body.groupName }, {
          where: { HCHAT_ROOM_Chat_Room_ID: req.body.roomId }
        }).then((updatedRes) => {
            console.log(updatedRes)
            if (updatedRes[0] == 0) {
              successHandler("Something went wrong", res);

            } else {
              successHandler("Successfully updated", res);

            }
          });
      } else {
        successHandler("Group name already exists", res);
      }
    }).catch(next);
});

// delete Group and private 
router.get('/deletegroup', (req, res, next) => {
  console.log(req.query)
  let input = req.query;
  if (input.isGroup == 1 || input.isGroup == true || input.isGroup == "true") {
    let exitdata = {
      groupname: "roomName",
      userId:input.senderUser,
      chatRoomId: input.roomId,
      user: { "userId": input.senderUser},
      leftType: "left",
    };
    ChatroomController.exitGroupChatRoom(exitdata, function (err, response) {    })
      Chatlog.update({  TChat_Log_Is_User_Delete: true,TChat_Log_Is_userLeft:true}, {
        where: {
          TChat_Log_Chat_Room_ID: input.roomId, TChat_Log_Sender: input.senderUser,
        },
        raw: true
      }).then((resp) => {
        console.log("@@@@@@@@@@@@@@", resp)
        MessageRecord.update({ TMESSAGES_Record_IS_Delete: true }, {
          where: {
            TMESSAGES_Record_Chat_Room_ID: input.roomId, TMESSAGES_Record_UID: input.senderUser,
          },
          raw: true
        }).then(response => {
          console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ 123")
          res.setHeader("statusCode", 200);
          res.status(200).json({
            status: "Success",
            statusCode: 200,
            data: "Successfully deleted"
          });
        });
      })
    
 

  }else{
    let setQuery = input.query;
    setQuery = setQuery.toString();
    console.log(setQuery)
                config.Bookshelf.knex.raw([setQuery]).then((response) => { 
                if(response) { 
                  console.log("roomId successfully");
                  console.log(response)
                }
              })
    Chatlog.update({  TChat_Log_Is_User_Delete: true}, {
      where: {
      
        TChat_Log_Chat_Room_ID: input.roomId, TChat_Log_Sender: input.senderUser,
      },
      raw: true
    }).then((resp) => {
      console.log("@@@@@ 12 @@@@@@@@@", resp)
      MessageRecord.update({ TMESSAGES_Record_IS_Delete: true }, {
        where: {
          TMESSAGES_Record_Chat_Room_ID: input.roomId, TMESSAGES_Record_UID: input.senderUser,
        },
        raw: true
      }).then(response => {
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ 333333333")

        res.setHeader("statusCode", 200);
        res.status(200).json({
          status: "Success",
          statusCode: 200,
          data: "Successfully deleted"
        });
      });
    })
  
  }
  

});

//delete Group and private 
router.post('/deleteRooms', (req, res, next) => {
  let roomId = [] ;
  console.log(req.body)
  let input = req.body;    
    let setQuery = input.query;
    setQuery = setQuery.toString();
                console.log(setQuery)
                config.raw([setQuery]).then((response) => {
                if(response) {
                  var finalObject = JSON.parse(JSON.stringify(response[0]));
                  console.log(finalObject[0]);
                  if(finalObject[0].length >0) {
                     finalObject[0].forEach((value) => {
                         roomId.push(value.roomId)
                     })                   
                   }
                  }
    console.log(roomId);
    Chatlog.update({  TChat_Log_Is_User_Delete: true,}, {
      where: {
        TChat_Log_Chat_Room_ID: roomId },
      raw: true
    }).then((resp) => {
      console.log("@@@@@ 12 @@@@@@@@@", resp)
      MessageRecord.update({ TMESSAGES_Record_IS_Delete: true }, {
        where: {
          TMESSAGES_Record_Chat_Room_ID: roomId
        },
        raw: true
      }).then(response => {
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ 333333333")

        res.setHeader("statusCode", 200);
        res.status(200).json({
          status: "Success",
          statusCode: 200,
          data: "Successfully deleted"
        });
      });
  })
  })

});

// router.put('/deleteRooms',(req,res,next)=>{
//   Chatlog.update({  TChat_Log_Is_User_Delete: true}, {
//     where: {
    
//       TChat_Log_Chat_Room_ID: req.query.roomIds,  },
//     raw: true
//   }).then((resp) => {
//      MessageRecord.update({ TMESSAGES_Record_IS_Delete: true }, {
//       where: {
//         TMESSAGES_Record_Chat_Room_ID:req.query.roomIds
//       },
//       raw: true
//     }).then(response => {
//       res.setHeader("statusCode", 200);
//       res.status(200).json({
//         status: "Success",
//         statusCode: 200,
//         data: "Successfully deleted"
//       });
//     });
//   })
// })
//clear chat history
router.put('/clearChat', (req, res, next) => {
  let input = req.body;
  MessageRecord.update({ TMESSAGES_Record_IS_Delete: true }, {
    where: {
      TMESSAGES_Record_Chat_Room_ID: input.roomId, TMESSAGES_Record_UID: input.userId,
    },
    raw: true
  }).then((resp) => {
    if (resp[0] != 0) {
      Chatlog.update({ TChat_Log_Message_ID: null }, {
        where: { TChat_Log_Chat_Room_ID: input.roomId,
        TChat_Log_Sender: input.userId }
    }).then(res => { })
      res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200,
        data: "Successfully cleared"
      });
    } else {
      res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200,
        data: "No Record Fond!!!"
      });
    }
  });
});

//unread message count
router.get('/unread_messages', (req, res, next) => {
  console.log(req.query.userId)
  MessageRecord.findAll({
    where: { TMESSAGES_Record_UID: req.query.userId, TMESSAGES_Record_Read_Status: "Sent", TMESSAGES_Record_IS_Delete: false },
    attributes: ["TMESSAGES_Record_Chat_Room_ID", [Sequelize.fn('count', Sequelize.col('TMESSAGES_Record_Chat_Room_ID')), 'Unread_msg_count']],
    group: ['TMESSAGES_Record_Chat_Room_ID'],
  })
    .then(unreadMsgCount => {
      console.log(unreadMsgCount)
      successHandler(unreadMsgCount, res);
    });
});

// group list
router.get('/groupDetails', (req, res, next) => {
  // let limit = parseInt(req.query.limit);
  // let offset = 0;
  // // Chatroom.findAndCountAll()
  // //   .then((data) => {
  // let page = parseInt(req.query.page);
  // // let pages = Math.ceil(data.count / limit);
  // offset = limit * (page - 1);
  // Chatroom.findAll({
  //   where: {
  //     HCHAT_ROOM_Chat_Room_ID: req.query.roomId
  //   },
  //   include: [
  //     {
  //       model: Userroom, as: 'chatRoomData',
  //       include: [
  //         { model: User, as: 'userRoomData' }
  //       ]
  //     },
  //   ],
  //   // attributes: ['DN_ID', 'DC_USERNAME', 'TUser_Image'],
  //   // limit: limit,
  //   // offset: offset,
  // })
  //   .then((chatRoomRes) => {

  //     filterAdminUser(req.query, chatRoomRes, function (filteredRoomUsers) {
  //       res.setHeader("statusCode", 200);
  //       res.status(200).json({
  //         status: "Success",
  //         statusCode: 200,
  //         data: filteredRoomUsers
  //         // count: data.count,
  //         // pages: pages
  //       });
  //     });
  //     // });
  //   })
  //   .catch(next);
  let roomId = req.query.roomId;
  let userId = req.query.userId
  let searchQuery
  let limit = req.query.limit || 100000
  let pageNumber = req.query.page || 1
  let offset = limit * (pageNumber - 1)
  if (req.query.search != undefined && req.query.search) {
    searchQuery = `'${req.query.search}'`
  } else {
    searchQuery = '""'
  }
  userId = `"${userId}"`
console.log(offset)
//  let setQuery=`CALL roomDetails(${limit},${offset},${searchQuery},${UseriD})`

 let setQuery=`CALL roomDetails(${limit},${offset},${roomId},${searchQuery},${userId})`

 config.raw([setQuery]).then((response) => {
   if(response){
   var finalObject = JSON.parse(JSON.stringify(response[0]));
  let userRole
   let  my_role=_.forEach(finalObject[2],function(res){
    if(res.DUSER_ROOM_UID==req.query.userId){
      userRole=res.DUSER_ROOM_Role
      return res.DUSER_ROOM_Role
    }
    
   })
 console.log(userRole,"WWWWWWWWWWWWWWWWWWWw",finalObject[2].length)
 if(my_role.length==0){
  my_role=[{DUSER_ROOM_Role:""}]

 }
//  _.forEach(finalObject[2],function(mydetail){
//    if(mydetail.DUSER_ROOM_UID==req.query.userId){
//     mydetail.name="You"
//    }
//  })
  res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200,
        total_count:finalObject[2].length, //data.count,
        my_role:userRole,
        page: pageNumber,//pages
        data: finalObject[1],
        users: finalObject[2],

       })
  }
  else{
    res.setHeader("statusCode", 204);
    res.status(204).json({
      status: "Success",
      statusCode: 204,
      data:"Something went wrong"
    })  }
  })
  
});

//filter admin users 
function filterAdminUser(reqQuery, data, callback) {
  if (data.length != 0) {
    let userData = JSON.parse(JSON.stringify(data));
    let itemsProcessed = 0;
    let contactsArray = [];
    let contactJson = {};

    for (var i = 0; i < userData.length; i++) {
      itemsProcessed++;
      let list = userData[i];
      if (_.size(list.chatRoomData) != 0) {
        let filterAdmin = _.filter(list.chatRoomData, function (roomUserObj) {
          if (roomUserObj.DUSER_ROOM_Role == "Admin") {
            return roomUserObj;
          }
        });
        if (filterAdmin.length != 0 && filterAdmin[0].DUSER_ROOM_UID == reqQuery.userId) {
          list.adminUser = true;
        } else {
          list.adminUser = false;
        }
      }
      if (itemsProcessed === userData.length) {
        callback(userData);
      }
    };
  } else {
    callback(data);
  }
}

//grouplist without current User
router.get('/grouplistexitcurrentuser', (req, res, next) => {
  let limit = parseInt(req.query.limit);
  let offset = 0;
  Chatroom.findAndCountAll()
    .then((data) => {
      let page = parseInt(req.query.page);
      let pages = Math.ceil(data.count / limit);
      offset = limit * (page - 1);
      Chatroom.findAll({
        where: {
          HCHAT_ROOM_Chat_Room_ID: req.query.roomId
        },
        include: [
          {
            model: Userroom, as: 'chatRoomData',
            include: [
              { model: User, as: 'userRoomData' }
            ]
          },
        ],

      })
        .then((chatRoomRes) => {

          omitcurrrentuser(req.query, chatRoomRes, function (filteredRoomUsers) {
            res.setHeader("statusCode", 200);
            res.status(200).json({
              status: "Success",
              statusCode: 200,
              data: filteredRoomUsers
              // count: data.count,
              // pages: pages
            });
          });
        });
    })
    .catch(next);
});

// omit current user
function omitcurrrentuser(reqQuery, data, callback) {
  if (data.length != 0) {
    let userData = JSON.parse(JSON.stringify(data));
    let itemsProcessed = 0;
    let contactsArray = [];
    let contactJson = {};
    // _.omit( JSON.parse(JSON.stringify(data)), )
    let filterAdmin = _.filter(JSON.parse(JSON.stringify(data))[0].chatRoomData, function (roomUserObj) {
      if (roomUserObj.DUSER_ROOM_UID != reqQuery.userId) {

        return roomUserObj;
      }
    })
    callback(filterAdmin);
  }
}
const Json2csvParser = require('json2csv').Parser;

//export chat conversation 
router.get('/export_chat', (req, res, next) => {

  console.log("###################################",req.query)
 
  let roomId = req.query.roomId;
  let userId = req.query.userId
  let searchQuery
  let limit = req.query.limit || 100000
  let pageNumber = req.query.page || 1
  let offset = limit * (pageNumber - 1)
  if (req.query.search != undefined && req.query.search) {
    searchQuery = `'${req.query.search}'`
  } else {
    searchQuery = '""'
  }
  userId = `"${userId}"`
  
  let setQuery=`CALL export_chat(${limit},${offset},${roomId},${searchQuery},${userId})`
  config.raw([setQuery]).then((response) => {
    // console.log(response)
   if(response){
    var finalObject = JSON.parse(JSON.stringify(response[0]));
    // console.log("########3",finalObject)
    let date = moment().format("YYYYDDMM")
  let dir = path.resolve(__dirname, '../../../../DeelChatFiles/Deelachatdoc/' + date);
  let timestamp= new Date().getTime();
  let content=finalObject[4] 
  let exportChat
  // console.log(content)
  let csv={}
  // sendMail("emal",'contant','body')
  
if(finalObject[4].length>0){
  let email= finalObject[3][0].DC_EMAil
  let username=finalObject[3][0].DC_FIRST_NAME+' '+finalObject[3][0].DC_LAST_NAME

  let parser = new Json2csvParser(content);
  csv = parser.parse(content);
  if (!fs.existsSync(dir)) {
    fs.mkdir(dir, err => {
   
       fs.writeFile(dir+'/'+date+'-'+timestamp+'deelChat.docx', csv, function (err) {
        console.log(err); // => null
        exportChat=configuration.authUrl + "/docs/" + date+'-'+timestamp+'deelChat.docx'
        
         sendMail(email,exportChat,username)

        res.setHeader("statusCode", 200);
        res.status(200).json({
          status: "Success",
          statusCode: 200,
          data:"Your chat has been exported successfully to registered email-id",
          URL:exportChat,
          EMAIL:email
        });
     
      })
    })
  }else{
        fs.writeFile(dir+'/'+date+'-'+timestamp+'deelChat.xls', csv, function (err) {
      console.log(err); // => null
   
      exportChat=configuration.authUrl + "/docs/" + date+'-'+timestamp+'deelChat.xls'
      sendMail(email,exportChat,username)

      res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200,
        data:"Your chat has been exported successfully to registered email-id",
        URL:exportChat,
        EMAIL:email
      });
    })
  // } catch (err) {
  //   console.error(err);
  }
  
}else{
  res.setHeader("statusCode", 202);
  res.status(202).json({
    status: "Success",
    statusCode: 202,
    data:"Don't have conversation to export",
   });
}
  
   }
   else{
     res.setHeader("statusCode", 204);
     res.status(204).json({
       status: "Success",
       statusCode: 204,
       data:"Something went wrong"
     })  }
   })

 
})

// message list

router.get('/messages', (req, res, next) => {

  let roomId = req.query.roomId;
  let userId = req.query.userId
  let searchQuery
  let limit = req.query.limit || 10
  let pageNumber = req.query.page || 1
  let offset = limit * (pageNumber - 1)

  console.log("@@@@@@@############ 1 /messges ", req.query)

  if (req.query.search != undefined && req.query.search) {
    searchQuery = `'${req.query.search}'`
  } else {
    searchQuery = '""'
  }
  userId = `"${userId}"`
  // })
  updateTodayIndicatorMessage(roomId,req.query.userId)

  let setQuery=`CALL get_messages(${limit},${offset},${roomId},${searchQuery},${userId})`
  config.raw([setQuery]).then((response) => {
   if(response){
    var finalObject = JSON.parse(JSON.stringify(response[0]));
    // console.log(finalObject)
let obj=_.forEach(finalObject[4],function(message){
  return message.TMESSAGES_Chat_Room_ID

}) 

// console.log(obj) 

    res.setHeader("statusCode", 200);
        res.status(200).json({
          status: "Success",
          statusCode: 200,
          total_count: finalObject[0][0].counts, //data.count,
        
          page: pageNumber,//pages
          data: {
            message: finalObject[4],
            roomDetail: finalObject[1],
            userRoom: finalObject[3],
            totalUsers: finalObject[2][0].total_members,
           }
        });
   }
   else{
     res.setHeader("statusCode", 204);
     res.status(204).json({
       status: "Success",
       statusCode: 204,
       data:"Something went wrong"
     })  }
   })
  // })
  //     Chatlog.findAll({
  //       where:{"TChat_Log_Sender":req.query.userId,TChat_Log_Is_User_Delete:2,TChat_Log_Chat_Room_ID:roomId,
  //     }}).then(resMsg=>{
  //       if(resMsg.length !=0){
  //        let FirstMsg=_.last(JSON.parse(JSON.stringify(resMsg)))
  //         let userLeftTime = FirstMsg.TChat_Log_User_Delete_DateTime;
  //         findQuery.TMESSAGES_Record_Created_On = {
  //           $gte: userLeftTime
  //         }
  // }
  //       // getChatRoomMessages(findQuery, req, res, next);

  //     })

  // Message.findAll(
  // {where:{"TMESSAGES_UID":req.query.userId,"TMESSAGES_IS_User_Exit":1, TMESSAGES_Chat_Room_ID: roomId},
  // }).then(lastmsgRes=>{
  //   if(lastmsgRes.length != 0 && lastmsgRes[0].TMESSAGES_Created_On != undefined){
  //     let userLeftTime = lastmsgRes[0].TMESSAGES_Created_On;
  //     findQuery.TMESSAGES_Record_Created_On = {
  //       $lte: userLeftTime.toISOString().slice(0, 19).replace('T', ' ')
  //     }
  //   }     
  // //   getChatRoomMessages(findQuery, req, res, next);
  // });
  // }else{

  // getChatRoomMessages(findQuery, req.query.userId, req, res, next);
  // }
});

// get chat room messages
function getChatRoomMessages(findQuery, userId, req, res, next) {

  console.log("@@@@@@@############ /messges ")
  let today = moment().utc().format("YYYY-MM-DD")
  let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

  let limit = 50;
  let offset = 0;

  MessageRecord.findAll({
    where: findQuery,
    include: [{ model: Message, as: 'roomMessages' }]

  }).then((foundMessages) => {
    let room = {}
    Chatroom.find({ where: { HCHAT_ROOM_Chat_Room_ID: findQuery.TMESSAGES_Record_Chat_Room_ID } }).then(resp => {
      room = JSON.parse(JSON.stringify(resp))
    })

    Userroom.findAll({
      where: {
        DUSER_ROOM_Chat_Room_ID: req.query.roomId
      },
      raw: true
    })
      .then((userRoomRes) => {
        let currentUser = _.filter(JSON.parse(JSON.stringify(userRoomRes)), function (roomUserObj) {
          if (roomUserObj.DUSER_ROOM_UID == userId) {
            return roomUserObj;
          }
        })
        if (foundMessages.length == 0) {

          foundMessages = []
          res.setHeader("statusCode", 200);
          res.status(200).json({
            status: "Success",
            statusCode: 200,
            data: {
              message: foundMessages,
              userRoom: {
                "HCHAT_ROOM_Chat_Room_ID": room.HCHAT_ROOM_Chat_Room_ID,
                "HCHAT_ROOM_Name": room.HCHAT_ROOM_Name
              },
              roomDetail: currentUser,
              totalUsers: JSON.parse(JSON.stringify(userRoomRes)).length
            }
          });
        } else {
          let filterArr;
          if (foundMessages.length == 1) {
            filterArr = foundMessages;
          } else {
            filterArr = foundMessages.slice(Math.max(foundMessages.length - 100, 0));
          }

          let filterArrData = JSON.parse(JSON.stringify(filterArr));
          let itemsProcessed = 0;
          for (var i = 0; i < filterArrData.length; i++) {
            itemsProcessed++;
            let list = filterArrData[i];
            if (list.TMESSAGES_File_Type == "PDF") {
              if (list.TMESSAGES_File_Name != undefined && list.TMESSAGES_File_Name != null) {
                let splitName = list.TMESSAGES_File_Name.split('-')[1];
                if (splitName != undefined) {
                  list.TMESSAGES_File_Name = splitName;
                } else {
                  list.TMESSAGES_File_Name = list.TMESSAGES_File_Name;
                }
                // console.log(list.TMESSAGES_File_Name)             
              }
            }
            if (itemsProcessed === filterArrData.length) {
              // console.log(filterArrData[0])
              filterArrData[0].roomMessages.TMESSAGES_Today_First_message = 1
              res.setHeader("statusCode", 200);
              res.status(200).json({
                status: "Success",
                statusCode: 200,
                data: {
                  message: filterArrData,
                  roomDetail: currentUser,
                  userRoom: {
                    "HCHAT_ROOM_Chat_Room_ID": room.HCHAT_ROOM_Chat_Room_ID,
                    "HCHAT_ROOM_Name": room.HCHAT_ROOM_Name
                  },
                  totalUsers: JSON.parse(JSON.stringify(userRoomRes)).length
                }
              });
            }
          };
        }
      });
    // successHandler(filterArr, res);
    // });
  })
    .catch(next);
}

//update today indicator message
function updateTodayIndicatorMessage(roomId, userId,callback) {
  let today = moment.utc().format('YYYY-MM-DD');
   MessageRecord.findAll({
    where: {
      TMESSAGES_Record_Created_date: today,
      TMESSAGES_Record_Chat_Room_ID: roomId,
      TMESSAGES_Record_IS_Delete: false,
      TMESSAGES_Record_UID:userId },
    raw: true
  }).then(message => {
      if (message.length != 0) {
 
      for (var i = 1; i < message.length; i++) {
        let todaysMessageList = message[i];
          if (todaysMessageList.TMESSAGES_Record_Today_First_message) {
 
          MessageRecord.update({ TMESSAGES_Record_Today_First_message: false }, {
            where: { TMESSAGES_Record_ID: todaysMessageList.TMESSAGES_Record_ID,
             }
          }).then((updatedRes) => { });

        } 
      }
    }
  })

  Message.findAll({
    where: {
      TMESSAGES_Created_date: today,
      TMESSAGES_Chat_Room_ID: roomId,
      TMESSAGES_IS_Delete: false,
      TMESSAGES_IS_User_Join: false,
     },
    raw: true
  }).then((todaysMessage) => {
    if (todaysMessage.length != 0) {
      for (var i = 1; i < todaysMessage.length; i++) {
 
        let todaysMessageList = todaysMessage[i];

        if (todaysMessageList.TMESSAGES_Today_First_message) {
          Message.update({ TMESSAGES_Today_First_message: false }, {
            where: { TMESSAGES_Message_ID: todaysMessageList.TMESSAGES_Message_ID }
          }).then((updatedRes) => { });

        }
      }
    }
  });

}

// GET request to get all chatrooms
router.get('/', (req, res, next) => {
  Chatroom.findAll()
    .then((foundChatrooms) => {
      successHandler(foundChatrooms, res);
    })
    .catch(next);
});





// home notificatioin count
router.get('/notification_count', (req, res, next) => {
  console.log("Checking count");
  Chatlog.findAll({
   where: { 
     TChat_Log_Sender:req.query.userId,
      TChat_Log_IS_Archive:true,
     }
  }).then(value=>{
    let chatlog = JSON.parse(JSON.stringify(value))
   let totalArchiveList=0
   chatRoom=[]
   if(chatlog.length>0){
     totalArchiveList=chatlog.length
     _.forEach(chatlog, data => {
       if (data.TChat_Log_Chat_Room_ID != null) {
        let request_id = data.TChat_Log_Request_ID;
        let setQuery=`CALL status_chekck(${request_id})`
        console.log(setQuery);
        config.raw([setQuery]).then((response) => {
         // updateNotification(UseriD)
         if(response){
          var finalObject = JSON.parse(JSON.stringify(response[0]));
          var status_id = finalObject.status_id;
          if(status_id !=7 || status_id != 9 || status_id != 5)
              chatRoom.push(data.TChat_Log_Chat_Room_ID)
         }
         })
       }
   })
  }
 
  MessageRecord.findAll({
   where: { 
     TMESSAGES_Record_UID: req.query.userId,
      TMESSAGES_Record_Read_Status:["Delivered", "Sent"] , 
      TMESSAGES_Record_IS_Delete: false,
      TMESSAGES_Record_Chat_Room_ID:{ [Op.not]: chatRoom
      } 
     },
   attributes: [[Sequelize.fn('count', Sequelize.col('TMESSAGES_Record_ID')), 'Total_notification_count']],
  })
  .then(unreadMsgCount => {
   res.setHeader("statusCode", 200);
   res.status(200).json({
     status: "Success",
     statusCode: 200,
     data: unreadMsgCount[0],
     totalArchiveList:totalArchiveList

   });   
  });
});
})


// POST request to add a message
router.post('/:chatroomId/messages', (req, res, next) => {
  User.findById(req.body.userId)
    .then((foundUser) => {
      return Message.create(req.body)
        .then((createdMessage) => {
          const createdMessageInJSON = createdMessage.toJSON();
          createdMessageInJSON.user = foundUser;
          return createdMessageInJSON;
        });
    })
    .then((completeMessage) => {
      successHandler(completeMessage, res);
    })
    .catch(next);
});

function failureHandler(data, res) {
  res.setHeader("statusCode", 400);
  res.status(400).json({
    status: "Failed",
    statusCode: 400,
    data: data
  });
}

function successHandler(data, res) {
  res.setHeader("statusCode", 200);
  res.status(200).json({
    status: "Success",
    statusCode: 200,
    data: data
  });
}
function sendMail(email,content,username){
  console.log(email,content,username)
  let notifidata={
          "email":email,
          "subject":"export check",
          "content":`<p>Hi Mr/Mrs.${username} <a href="${content}">Click here</a>to download chat history</p>`
      }
      console.log(configuration.Fetch39API)
  rp({
    url:configuration.Fetch39API+'deelChat/exportchat',
    'Content-type': 'application/json',

    method: 'POST',
    json: true,
    body:notifidata
  })
  .then((response) => {
    // console.log("Error",req)
    console.log('success', response);
  });

}

module.exports = router;
