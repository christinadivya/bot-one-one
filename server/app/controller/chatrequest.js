const router = require('express').Router();
const passport = require('passport');
const moment = require('moment');

const Chatrequest = require('../../model/chatrequest');
const Chatroom = require('../../model/chatroom');
const Chatlog = require('../../model/chatlog');
const User = require('../../model/user');
const Userroom = require('../../model/userroom');
const Message = require('../../model/message');
const Notification = require('../../model/notification');

const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const map = require('lodash/map');
const each = require('lodash/forEach');
const last = require('lodash/last');
const size = require('lodash/size');
const filter = require('lodash/filter');
const indexOf = require('lodash/indexOf');
const partialRight = require('lodash/partialRight');
const pick = require('lodash/pick');
const _ = require('underscore');
const request = require('request');
// const azure = require('azure');
// const azure = require('azure-sb');
const config = require('../../../config/configuration').data;
// const notificationHubService = azure.createNotificationHubService(config.azure.NotificationHubName,config.azure.CONNECTIONSTRING );

module.exports = {

  // check request already sent or not 
  checkRequestSend: function (reqData, callback) {
    let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let input = reqData.data;
    input.TCHAT_REQUEST_Status = 'Request';
    input.TCHAT_REQUEST_Created_On = new Date().toISOString().slice(0, 19).replace('T', ' ');
    Chatrequest.findAll({
      where: {
        TCHAT_REQUEST_Sender: input.TCHAT_REQUEST_Sender,
        TCHAT_REQUEST_Receiver: input.TCHAT_REQUEST_Receiver,
        TCHAT_REQUEST_IS_Delete: false
      }
    })
      .then((chatReqResponse) => {
        let roomId = {
          roomId: null
        }
        if (chatReqResponse.length == 0) {
          callback(null, false, roomId);
        } else {
          roomId.roomId =
            callback(null, true, roomId);
        }
      })
  },

  // send chat request for new chat initiation 
  sendChatRequest: function (reqData, callback) {
    let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let input = reqData.data;
    input.TCHAT_REQUEST_Status = 'Request';
    input.TCHAT_REQUEST_Created_On = new Date().toISOString().slice(0, 19).replace('T', ' ');
    Chatrequest.findAll({
      where: {
        TCHAT_REQUEST_Sender: input.TCHAT_REQUEST_Sender,
        TCHAT_REQUEST_Receiver: input.TCHAT_REQUEST_Receiver,
        TCHAT_REQUEST_IS_Delete: false
      }
    })
      .then((chatReqResponse) => {
        if (chatReqResponse.length == 0) {
          callback(null, false);
        } else {
          callback(null, true);
        }
      })
  },

  // Update Accept/Reject chat request status
  UpdateChatRequestStatus: function (reqData, callback) {
    let data = reqData.data;
    let roomDetailsData = reqData.roomData;

    Chatrequest.findAll({
      where: {
        TCHAT_REQUEST_Chat_Request_ID: data.TCHAT_REQUEST_Chat_Request_ID
      },
      raw: true
    }).then((chatReqResponse) => {

      let updateQuery = {
        TCHAT_REQUEST_Status: data.TCHAT_REQUEST_Status,
        TCHAT_REQUEST_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),// moment.utc(new Date().toISOString().slice(0, 19).replace('T', ' ')).format("YYYY-MM-DDThh:mm:ss.SSS[Z]"),
        // TCHAT_REQUEST_Mobile_dateTime:data.TCHAT_REQUEST_Mobile_dateTime
      }
      if (data.TCHAT_REQUEST_Status == 'Reject') {
        updateQuery.TCHAT_REQUEST_IS_Delete = true
      }

      if (chatReqResponse) {
        Chatrequest.update(updateQuery, {
          where: {
            TCHAT_REQUEST_Chat_Request_ID: data.TCHAT_REQUEST_Chat_Request_ID
          }
        }).then((chatReqUpdatedResponse) => {

          let chatLogInput = {
            "TChat_Log_Chat_Request_ID": chatReqResponse[0].TCHAT_REQUEST_Chat_Request_ID,
            "TChat_Log_Sender": chatReqResponse[0].TCHAT_REQUEST_Sender,
            "TChat_Log_Receiver": chatReqResponse[0].TCHAT_REQUEST_Receiver,
            "TChat_Log_Status": data.TCHAT_REQUEST_Status
          };

          createUserLogs(data, roomDetailsData, chatLogInput, callback);

          chatLogInput["TCHAT_REQUEST_Status"] = data.TCHAT_REQUEST_Status
          chatLogInput['Message'] = "Replied to chatrequest",
            notifyRoomUser(chatLogInput);
        })
      }
    });
  },

  //get my contact and requested list 
  getMyContactAndRequestedListNEW: function (req, res, next, callback) {
    let limit = parseInt(req.query.limit);
    let offset = 0;
    // Chatlog.findAndCountAll()
    //   .then((data) => {
        let page = parseInt(req.query.page);
        // let pages = Math.ceil(data.count / limit);
        offset = limit * (page - 1);
        Chatlog.findAll({
          where: { TChat_Log_Sender: req.query.userId, TChat_Log_IS_Delete: false },
          where: Sequelize.or(
            Sequelize.and(
              { TChat_Log_Sender: req.query.userId },
              { TChat_Log_IS_Delete: false }
            ),
            Sequelize.and(
              { TChat_Log_Sender: req.query.userId },
              { TChat_Log_IS_Delete: false })),
        include: { all: true }
          // raw: true
        })
          .then((users) => {
            myContactsFilterNEW(req.query.userId, users, function (filteredUserData) {
              callback({ filteredUserData: filteredUserData });
            });
          // });
      })
      .catch(next);
  },


  getMyContactAndRequestedList: function (req, res, next, callback) {
    let limit = parseInt(req.query.limit);
    let offset = 0;
    Chatlog.findAndCountAll()
      .then((data) => {
        let page = parseInt(req.query.page);
        let pages = Math.ceil(data.count / limit);
        offset = limit * (page - 1);
        Chatlog.findAll({
          where: {
            [Op.or]: [{ TChat_Log_Sender: req.query.userId }, { TChat_Log_Receiver: req.query.userId }],
            [Op.or]: [{ TChat_Log_Status: 'Accept' }, { TChat_Log_Status: 'Request' }],

            TChat_Log_IS_Delete: false
          },
          include: [
            {
              model: Chatroom, as: 'chatRoomLogs', attributes: ['HCHAT_ROOM_Chat_Room_ID', 'HCHAT_ROOM_Name', 'HCHAT_ROOM_IS_Group'],
              include: [
                {
                  model: Userroom, as: 'chatRoomData',
                  include: [{ model: User, as: 'userRoomData', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE',] }]
                }
              ]
            }
          ],
          // limit: limit,
          // offset: offset
        })
          .then((users) => {
            myContactsFilter(req.query.userId, users, function (filteredUserData) {
              callback({ filteredUserData: filteredUserData, data: data, pages: pages });
            });
          });
      })
      .catch(next);
  },

  //get my contact list who are in my logs
  getMyContactList: function (req, res, next, callback) {
    let limit = parseInt(req.query.limit);
    let offset = 0;
    // Chatlog.findAndCountAll({
    // .then((data) => {
    // let page = parseInt(req.query.page);
    // let pages = Math.ceil(data.count / limit);
    // offset = limit * (page - 1);
    Chatlog.findAll({
      where: {
        [Op.or]: [{ TChat_Log_Sender: req.query.userId }],
        // TChat_Log_Status: 'Accept',
          TChat_Log_IS_Accepted: false,
        TChat_Log_IS_Delete: false
      },
      include: [
        {
          model: Chatroom, as: 'chatRoomLogs', attributes: ['HCHAT_ROOM_Chat_Room_ID', 'HCHAT_ROOM_Name', 'HCHAT_ROOM_IS_Group'],
          include: [
            {
              model: Userroom, as: 'chatRoomData',
              include: [{ model: User, as: 'userRoomData', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE',] }]
            }
          ]
        }
      ],
      // limit: limit,
      // offset: offset
    })
      .then((users) => {
        console.log(users)
        myContactsFilter(req.query.userId, users, function (filteredUserData) {
          callback({ filteredUserData: filteredUserData });
        });
        // });
      })
      .catch(next);
  }
}

// my contacts filter
function myContactsFilterNEW(userId, data, callback) {
  if (data.length != 0) {
    let userData = JSON.parse(JSON.stringify(data));
    let itemsProcessed = 0;
    let usrArr = [];

    for (var i = 0; i < userData.length; i++) {
      itemsProcessed++;
      let list = userData[i];

      if (list.senderUser != null && list.receiverUser != null) {
        if (list.senderUser.DN_ID != userId) {
          list.reqUser = list.senderUser;
        }
        else if (list.receiverUser.DN_ID != userId) {
          list.reqUser = list.receiverUser;
        }
      }
      if (itemsProcessed === userData.length) {
        let mapped = _.map(userData, 'reqUser');
        let non_duplidated_data = _.uniq(mapped, 'DN_ID');
        callback(non_duplidated_data);
      }
    };
  } else {
    callback(data);
  }
}

function myContactsFilter(userId, data, callback) {
  if (data.length != 0) {
    let userData = JSON.parse(JSON.stringify(data));
    let itemsProcessed = 0;
    let contactsArray = [];
    let contactJson = {};

    for (var i = 0; i < userData.length; i++) {
      itemsProcessed++;
      let list = userData[i];

      if (list.chatRoomLogs != null && !list.chatRoomLogs.HCHAT_ROOM_IS_Group && _.size(list.chatRoomLogs.chatRoomData) != 0) {
        let messageReceiver = _.filter(list.chatRoomLogs.chatRoomData, function (roomUserObj) {
          if (roomUserObj.DUSER_ROOM_UID != userId) {
            return roomUserObj;
          }
        });

        list.contacts = messageReceiver[0].userRoomData;
        list.contacts.chatRoomId = list.chatRoomLogs.HCHAT_ROOM_Chat_Room_ID;
        list.contacts.roomname = list.chatRoomLogs.HCHAT_ROOM_Name;
      }

      if (itemsProcessed === userData.length) {
        var mapped = _.map(userData, 'contacts');
        console.log("@@@@@@@@@@@@@@@@",mapped)
        callback(mapped);
      }
    };
  } else {
    callback(data);
  }
}

//Create user losgs
function createUserLogs(data, roomDetailsData, chatLogInput, callback) {
  // if (roomDetailsData != null && data.TCHAT_REQUEST_Status == 'Accept') {
  //   chatLogInput['TChat_Log_Chat_Room_ID'] = roomDetailsData[0].HCHAT_ROOM_Chat_Room_ID;
  //   let chatLogInputForUsers = {
  //     "TChat_Log_Status": chatLogInput.TChat_Log_Status,
  //     "TChat_Log_Chat_Request_ID": chatLogInput.TChat_Log_Chat_Request_ID,
  //     "TChat_Log_Chat_Room_ID": roomDetailsData[0].HCHAT_ROOM_Chat_Room_ID,
  //     "TChat_Log_Sender": chatLogInput.TChat_Log_Receiver,
  //     "TChat_Log_Receiver": chatLogInput.TChat_Log_Sender,
  //     "TChat_Log_IS_Accepted": true,
  //     "TChat_Log_Updated_On":new Date().toISOString().slice(0, 19).replace('T', ' ')
  //   };
  //   Chatlog.create(chatLogInputForUsers).then((resp) => {});
  // }


  Chatlog.findAll({
    where: chatLogInput,
    raw: true
  }).then((logRes) => {
    if (logRes.length == 0) {
      chatLogInput.TChat_Log_Updated_On=new Date().toISOString().slice(0, 19).replace('T', ' ')
      Chatlog.create(chatLogInput).then((chatLogResponse) => {
        const dataObj = chatLogResponse.get({ plain: true });
        let logUpdateQuery = { TChat_Log_Updated_On:new Date().toISOString().slice(0, 19).replace('T', ' '),TChat_Log_IS_Delete: true };
        let logFindQuery = {
          "TChat_Log_Chat_Request_ID": chatLogInput.TChat_Log_Chat_Request_ID,
          "TChat_Log_Sender": chatLogInput.TChat_Log_Sender,
          "TChat_Log_Receiver": chatLogInput.TChat_Log_Receiver,
          "TChat_Log_Status": 'Request'
        };

        Chatlog.update(logUpdateQuery, {
          where: logFindQuery
        })
          .then((updatedRes) => {
            callback(null, dataObj);
          });
      })
    } else {
      callback(null, null);
    }
  })
}

// notify Room User 
function notifyRoomUser(data) {
  let createNotJson = {
    TNOTIFICATION_LOGS_Notification_Type: data.TCHAT_REQUEST_Status,
    TNOTIFICATION_LOGS_Message: data.Message,
    TNOTIFICATION_LOGS_Sender: data.TChat_Log_Receiver,
    TNOTIFICATION_LOGS_Receiver: data.TChat_Log_Sender
  }
  // Notification.create(createNotJson).then((notifyRes) => { 
  //   const dataObj = notifyRes.get({plain:true});
  //   sendPushNotification(dataObj);
  // });
}
//send push notification 
function sendPushNotification(dataObj, req) {
  Notification.findAll({
    where: {
      TNOTIFICATION_LOGS_Notification_Logs_ID: dataObj.TNOTIFICATION_LOGS_Notification_Logs_ID
    },
    include: [
      { model: User, as: 'notificationReceiver' },
      { model: User, as: 'notificationSender' }
    ],
    // raw: true
  })
    .then((notifyResp) => {

      if (notifyResp.length != 0) {

        let userDetails = notifyResp[0].notificationReceiver;
        let senderUserDetails = notifyResp[0].notificationSender;


        let notifyData = {
          "Receiver": userDetails.DN_ID,
          "NotificationType": "Request",
          "NotificationValue": "",
          "Message": dataObj.TNOTIFICATION_LOGS_Message,
          // "NotificationId": dataObj.TNOTIFICATION_LOGS_Notification_Logs_ID,
          "Sender": userDetails.DC_USERNAME
        }
        request.post({
          headers: {
            // 'Authorization': req.headers['authorization'],
            'Content-Type': 'application/json'
          },
          // url: config.sendAzureNotificationURL,
          form: notifyData
        }, function (err, response, body) {

          console.log(err)
          console.log(body)
          if (body == "Success") {
          }
        });


      }
    });
}

function updateNotificationStatus(dataObj) {
  Notification.update(
    {
      TNOTIFICATION_LOGS_Status: "Delivered"
    }, {
      where: {
        TNOTIFICATION_LOGS_Notification_Logs_ID: dataObj.TNOTIFICATION_LOGS_Notification_Logs_ID
      },
      raw: true
    })
    .then((notifyRes) => {
    });
}