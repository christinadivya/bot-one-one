const router = require('express').Router();
const passport = require('passport');
const moment = require('moment');
const config = require('../../model/DB_connection')
const config_SQL = require('../../model/_db')

const Chatrequest = require('../../model/chatrequest');
const Chatroom = require('../../model/chatroom');
const Chatlog = require('../../model/chatlog');
const User = require('../../model/user');
const Userroom = require('../../model/userroom');
const Message = require('../../model/message');
const Notification = require('../../model/notification');
const request = require('request');
const querystring = require('querystring');
const rp = require('request-promise');
const authUser =require('./auth').authUser
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
const MessageRecord = require('../../model/messageRecord')

const ChatrequestController = require('../controller/chatrequest');
// const azure = require('azure');
// const azure = require('azure-sb');
const configuration = require('../../../config/configuration');
// const notificationHubService = azure.createNotificationHubService(config.azure.NotificationHubName,config.azure.CONNECTIONSTRING );


let mysql = require('mysql');

let connection = mysql.createConnection(config);



// connection.end();

// List my contact with my group list:
router.get('/my_contacts_and_groups', (req, res, next) => {
  // ChatrequestController.getMyContactList(req, res, next, function (responseData) {
  let limit = parseInt(req.query.limit);
  let page = parseInt(req.query.page);

  Chatlog.findAll({
    order: [['TChat_Log_Updated_On', 'DESC']],
    where: {
      TChat_Log_Status: 'Message',
      [Op.or]: [{ TChat_Log_Sender: req.query.userId }],
      TChat_Log_IS_Archive: false,
      TChat_Log_IS_Delete: false,
      TChat_Log_Is_userLeft: false
    },
    include: [
      // { model: User, as: 'senderUser', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE',] },
      { model: User, as: 'receiverUser', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE',] },
      {
        model: Chatroom, as: 'chatRoomLogs', attributes: ['HCHAT_ROOM_Chat_Room_ID', 'HCHAT_ROOM_Name', 'HCHAT_ROOM_IS_Group', 'HCHAT_ROOM_IS_Delete']
      }
    ],
    attributes: []

  })
    .then((users) => {
      if (users.length > 0) {
        let logsData = JSON.parse(JSON.stringify(users));
        let searchQuery = req.query.search;
        let finalResult;
        if (searchQuery) {
          var searchResult = _.filter(logsData, function (p) {

            if (p.receiverUser != null) {
              if (p.receiverUser.DC_USERNAME.toUpperCase().includes(searchQuery.toUpperCase())) {
                return p
              }
            } else if (p.chatRoomLogs.HCHAT_ROOM_Name != undefined) {
              if (p.chatRoomLogs.HCHAT_ROOM_Name.toUpperCase().includes(searchQuery.toUpperCase())) {
                return p
              }
            }
          });
          finalResult = searchResult;
        } else {
          finalResult = logsData;
        }

        let paginationResult = Paginator(finalResult, page, limit);

        res.setHeader("statusCode", 200);
        res.status(200).json({
          status: "Success",
          statusCode: 200,
          data: paginationResult.data,
          count: paginationResult.total,
          pages: paginationResult.total_pages
        });

      }
    });
  // });
});

// List my contact list:
router.get('/my_contacts', (req, res, next) => {
  ChatrequestController.getMyContactList(req, res, next, function (responseData) {
    let limit = parseInt(req.query.limit);
    let page = parseInt(req.query.page);
    console.log(responseData)
    let paginationResult = Paginator(responseData.filteredUserData.reverse(), page, limit);

    res.setHeader("statusCode", 200);
    res.status(200).json({
      status: "Success",
      statusCode: 200,
      data: paginationResult.data,
      count: paginationResult.total,
      pages: paginationResult.total_pages
    });
  });
});

// update chat logs
router.put('/updateLogs', (req, res, next) => {
  Chatlog.findAll({
    where: {
      TChat_Log_Chat_Log_ID: req.query.logId
    },
    raw: true
  })
    .then((foundChatlog) => {
      if (foundChatlog.length != 0) {
        Chatlog.update({ TChat_Log_IS_Delete: true }, {
          where: { TChat_Log_Chat_Log_ID: req.query.logId }
        })
          .then((updatedRes) => {
            successHandler("Successfully updated", res);
          });
      }
    }).catch(next);
});

// archive group details
router.get('/getDocGroup', (req, res, next) => {

  Chatlog.findAndCountAll()
    .then((data) => {

      Chatlog.findAll({
        where: {

          [Op.or]: [{ TChat_Log_Status: 'Accept' }, { TChat_Log_Status: 'Request' }, { TChat_Log_Status: 'Message' }],


          TChat_Log_Status: {
            [Op.ne]: 'Reject'
          },

          TChat_Log_Chat_Room_ID: req.query.roomId,
          TChat_Log_IS_Archive: false,
          TChat_Log_IS_Delete: false,
          // TChat_Log_IS_Accepted: false,
          TChat_Log_Chat_Request_ID: {
            [Op.or]: {
              [Op.ne]: 0,
              [Op.eq]: 0
            }
          }
        },
        include: [
          { model: Chatrequest, as: 'chatRequestData', attributes: ['TCHAT_REQUEST_Chat_Request_ID', 'TCHAT_REQUEST_IS_Delete', 'TCHAT_REQUEST_Created_On', 'TCHAT_REQUEST_Updated_On'] },
          { model: User, as: 'senderUser', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE',] },
          { model: User, as: 'receiverUser', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE',] },
          {
            model: Chatroom, as: 'chatRoomLogs', attributes: ['HCHAT_ROOM_Chat_Room_ID', 'HCHAT_ROOM_Name', 'HCHAT_ROOM_IS_Group', 'HCHAT_ROOM_IS_Delete', 'HCHAT_ROOMS_Created_On', 'HCHAT_ROOMS_Message_ID'],
            include: [
              {
                model: Userroom, as: 'chatRoomData',
                include: [{ model: User, as: 'userRoomData', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE',] }]
              },
              {
                model: Message, as: 'roomMessage',  // { model: Message, as:'userRoomMessage',

              },
            ]
          }
        ],

      })
        .then((users) => {
          requestedStatus(req.query, req.query.userId, users, function (userData) {




            let paginationResult = Paginator(userData.reverse());

            res.setHeader("statusCode", 200);
            res.status(200).json({
              status: "Success",
              statusCode: 200,
              data: paginationResult.data,

            });
          });
        });
    })
})

// get My logs (HISTORY)
router.get('/my_logs',(req, res, next) => {
 
  let UseriD = req.query.userId
  const requestId=req.query.requestId
  let searchQuery=req.query.search||""
  let limit = req.query.limit || 10
  let pageNumber = req.query.page || 1
  let offset = limit * (pageNumber - 1)
  let isForward = false;
  if (req.query.search) {
    searchQuery = req.query.search;
  } else {
    searchQuery = '""'
  }
  let archiveList;
  if(req.query.archiveList == 1){
    archiveList= true
  }else {
    archiveList= false
  }
  console.log(searchQuery)
 UseriD=`"${UseriD}"`
  // let setQuery=`CALL my_logs_test(${limit},${offset},${searchQuery},${UseriD},${isForward},${requestId})`
  let setQuery=`CALL my_logs(${limit},${offset},${searchQuery},${UseriD},${isForward})`

 console.log(setQuery);
 config.raw([setQuery]).then((response) => {
  // updateNotification(UseriD)
  if(response){
   var finalObject = JSON.parse(JSON.stringify(response[0]));
   res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200,
        total_count: finalObject[1].length, //data.count,
        page: pageNumber,//pages
        data: finalObject[1],
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
function updateNotification(userId){
  rp({
    url: configuration.DeelchatAPI + 'deelChat/updatebatchnotificationcount',
    'Content-type': 'application/json',

    method: 'PUT',
    json: true,
    body: {
      "userId":userId,
      "typeList":[3]
      }
})
    .then((response) => {
         console.log('success', response);
    });
}
//temp format method for my logs
function requestedStatus(inputQuery, userId, data, callback) {
  if (data.length != 0) {
    let logsData = JSON.parse(JSON.stringify(data));
    let itemsProcessed = 0;

    for (var i = 0; i < logsData.length; i++) {
      itemsProcessed++;
      let list = logsData[i];
     
      if (itemsProcessed === logsData.length) {
        let uniqueArray = arrUnique(logsData);
        let sortArray = uniqueArray.sort(dynamicSort("messageCreatedTime"));
        callback(sortArray);

      }
    };
  } else {
    callback(data);
  }
}

//find arr Unique
function arrUnique(standardsList) {
  var cleaned = [];
  standardsList.forEach(function (itm) {
    var unique = true;
    cleaned.forEach(function (itm2) {
      if (itm.TChat_Log_Status == "Message" && itm.chatRoomLogs != null && itm.chatRoomLogs.HCHAT_ROOM_Chat_Room_ID != null) {
        if (itm2.TChat_Log_Status == "Message" && itm2.chatRoomLogs != null && itm2.chatRoomLogs.HCHAT_ROOM_Chat_Room_ID != null) {
          if (_.isEqual(itm.chatRoomLogs.HCHAT_ROOM_Chat_Room_ID, itm2.chatRoomLogs.HCHAT_ROOM_Chat_Room_ID)) unique = false;
        }
      }
    });
    if (unique) cleaned.push(itm);
  });
  return cleaned;
}

//sortArray
function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
}

// Send chat request to user

router.post('/check_request_status', (req, res, next) => {

  let timeNow = moment.utc(new Date().toISOString().slice(0, 19).replace('T', ' ')).format("YYYY-MM-DDThh:mm:ss.SSS[Z]");

  let input = req.body;

  input.TCHAT_REQUEST_Status = 'Request';
  input.TCHAT_REQUEST_Created_On = new Date().toISOString().slice(0, 19).replace('T', ' ');
  // input.TCHAT_REQUEST_Mobile_dateTime=req.body.TCHAT_REQUEST_Mobile_dateTime
  Chatrequest.findAll({
    where: Sequelize.or(
      Sequelize.and(
        { TCHAT_REQUEST_Sender: input.TCHAT_REQUEST_Sender },
        { TCHAT_REQUEST_Receiver: input.TCHAT_REQUEST_Receiver },
        { TCHAT_REQUEST_IS_Delete: false }
      ),
      Sequelize.and(
        { TCHAT_REQUEST_Sender: input.TCHAT_REQUEST_Receiver },
        { TCHAT_REQUEST_Receiver: input.TCHAT_REQUEST_Sender },
        { TCHAT_REQUEST_IS_Delete: false }
      ))

    // [Op.or]: [{TCHAT_REQUEST_Status: 'Request'}, {TCHAT_REQUEST_Status: 'Accept'}],
    // where: {
    //   TCHAT_REQUEST_Sender: input.TCHAT_REQUEST_Sender,
    //   TCHAT_REQUEST_Receiver: input.TCHAT_REQUEST_Receiver,
    //   TCHAT_REQUEST_IS_Delete: false
    // }
  })
    .then((chatReqResponse) => {
      let roomId = {
        roomId: null
      }
      if (chatReqResponse.length == 0) {
        // callback(null,false,roomId);
        res.setHeader("statusCode", 200);
        res.status(200).json({
          status: "Success",
          statusCode: 200,
          request_status: false,
          roomId: null,

        });
      } else {
        Chatlog.findAll({

          where: {
            TChat_Log_Chat_Request_ID: JSON.parse(JSON.stringify(chatReqResponse))[0].TCHAT_REQUEST_Chat_Request_ID,
            TChat_Log_Status: "Accept"
          },

          raw: true
        }).then(resp => {
          res.setHeader("statusCode", 200);
          res.status(200).json({
            status: "Success",
            statusCode: 200,
            request_status: true,
            roomId: resp[0].TChat_Log_Chat_Room_ID,

          });
          //   Chatlog.update({TChat_Log_Is_User_Delete:2, TChat_Log_User_requested:true,TChat_Log_User_Delete_DateTime:new Date().toISOString().slice(0, 19).replace('T', ' ')}, {
          //     where: {TChat_Log_Chat_Room_ID:resp[0].TChat_Log_Chat_Room_ID,
          //     TChat_Log_Sender: input.TCHAT_REQUEST_Sender,
          //     },
          //     raw: true
          // }).then(resp => {
          //   // console.log(resp)

          // })

          Chatlog.update({ TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '), TChat_Log_IS_Delete: false }, {
            where: {
              TChat_Log_Chat_Room_ID: resp[0].TChat_Log_Chat_Room_ID,
              // TChat_Log_Receiver:input.TCHAT_REQUEST_Sender 
            }
          }).then(res => {

            // console.log(res)
          })
        })

        //  roomId.roomId=resp[0].TChat_Log_Chat_Room_ID

      }

    })
    .catch(next);
})

//send a request for initiate chat to other user for single chat 
router.post('/send_request', (req, res, next) => {

  let timeNow = moment.utc(new Date().toISOString().slice(0, 19).replace('T', ' ')).format("YYYY-MM-DDThh:mm:ss.SSS[Z]");

  let input = req.body;

  input.TCHAT_REQUEST_Status = 'Request';
  input.TCHAT_REQUEST_Created_On = new Date().toISOString().slice(0, 19).replace('T', ' ');
  // input.TCHAT_REQUEST_Mobile_dateTime=req.body.TCHAT_REQUEST_Mobile_dateTime
  Chatrequest.findAll({
    where: Sequelize.or(
      Sequelize.and(
        { TCHAT_REQUEST_Sender: input.TCHAT_REQUEST_Sender },
        { TCHAT_REQUEST_Receiver: input.TCHAT_REQUEST_Receiver },
        { TCHAT_REQUEST_IS_Delete: false }
      ),
      Sequelize.and(
        { TCHAT_REQUEST_Sender: input.TCHAT_REQUEST_Receiver },
        { TCHAT_REQUEST_Receiver: input.TCHAT_REQUEST_Sender },
        { TCHAT_REQUEST_IS_Delete: false }
      ))

    // [Op.or]: [{TCHAT_REQUEST_Status: 'Request'}, {TCHAT_REQUEST_Status: 'Accept'}],
    // where: {
    //   TCHAT_REQUEST_Sender: input.TCHAT_REQUEST_Sender,
    //   TCHAT_REQUEST_Receiver: input.TCHAT_REQUEST_Receiver,
    //   TCHAT_REQUEST_IS_Delete: false
    // }
  })
    .then((chatReqResponse) => {
      if (chatReqResponse.length == 0) {
        Chatrequest.create(input)
          .then((response) => {

            input['TChat_Log_Chat_Request_ID'] = response.toJSON().TCHAT_REQUEST_Chat_Request_ID;
            input['TChat_Log_Sender'] = response.toJSON().TCHAT_REQUEST_Sender;
            input['TChat_Log_Receiver'] = response.toJSON().TCHAT_REQUEST_Receiver;
            input['TChat_Log_Status'] = response.toJSON().TCHAT_REQUEST_Status;
            input["TChat_Log_Updated_On"] = new Date().toISOString().slice(0, 19).replace('T', ' ');
            //  input['TChat_Log__Updated_On']=timeNow;

            return Chatlog.create(input)
              .then((createdLog) => {

                const createdLogInJSON = createdLog.toJSON();
                return createdLogInJSON;
              });
          })
          .then((completeResponse) => {
            successHandler("Request sent", res);
            // notifyRoomUser(input,req);
          })
          .catch(next);
      } else {
        // console.log( chatReqResponse)

        // console.log( JSON.parse(JSON.stringify(chatReqResponse))[0])

        Chatlog.findAll({

          where: {
            TChat_Log_Chat_Request_ID: JSON.parse(JSON.stringify(chatReqResponse))[0].TCHAT_REQUEST_Chat_Request_ID,
            TChat_Log_Status: "Accept"
          },

          raw: true
        }).then(resp => {

          //   Chatlog.update({TChat_Log_Is_User_Delete:2, TChat_Log_User_requested:true,TChat_Log_User_Delete_DateTime:new Date().toISOString().slice(0, 19).replace('T', ' ')}, {
          //     where: {TChat_Log_Chat_Room_ID:resp[0].TChat_Log_Chat_Room_ID,
          //     TChat_Log_Sender: input.TCHAT_REQUEST_Sender,TChat_Log_Is_User_Delete:1
          //     // [Op.or]: [{TChat_Log_Status: 'Accept'}, {TChat_Log_Status: 'Request'}],

          //     },
          //     raw: true
          // }).then(resp => {

          // })



          Chatlog.update({ TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '), TChat_Log_IS_Delete: false }, {
            where: {
              TChat_Log_Chat_Room_ID: resp[0].TChat_Log_Chat_Room_ID,
              // TChat_Log_Sender:input.TCHAT_REQUEST_Sender
            }
          }).then(res => {
            // console.log(res)
          })
        })


        successHandler("Request already sent", res);
      }
    })
    .catch(next);
});

//list out  request list
router.get('/my_request', (req, res, next) => {
  let limit = parseInt(req.query.limit);
  let offset = 0;
  Chatlog.findAndCountAll()
    .then((data) => {
      let page = parseInt(req.query.page);
      let pages = Math.ceil(data.count / limit);
      offset = limit * (page - 1);
      Chatrequest.findAll({
        where: {
          [Op.or]: [{ TCHAT_REQUEST_Sender: req.query.userId }, { TCHAT_REQUEST_Receiver: req.query.userId }],
          TCHAT_REQUEST_Status: "Accept"
        },
        include: [
          {
            model: User, as: 'sender', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE'],
          },
          {
            model: User, as: 'receiver', attributes: ['DN_ID', 'DC_USERNAME', 'DC_USER_IMAGE']
          },
        ],
        limit: limit,
        offset: offset
      })
        .then((users) => {

          res.setHeader("statusCode", 200);
          res.status(200).json({
            status: "Success",
            statusCode: 200,
            data: users,
            count: data.count,
            pages: pages
          });

        })
    })
    .catch(next);
});


function notifyRoomUser(data, req) {
  let createNotJson = {
    TNOTIFICATION_LOGS_Notification_Type: data.TCHAT_REQUEST_Status,
    TNOTIFICATION_LOGS_Message: "New chat request received",
    TNOTIFICATION_LOGS_Sender: data.TChat_Log_Sender,
    TNOTIFICATION_LOGS_Receiver: data.TChat_Log_Receiver,
  }
  // Notification.create(createNotJson).then((notifyRes) => { 
  //   const dataObj = notifyRes.get({plain:true});
  //   sendPushNotification(dataObj,req);
  // });
}

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
          "Sender": senderUserDetails.DC_USERNAME
        }
        request.post({
          headers: {
            'Authorization': req.headers['authorization'],
            'Content-Type': 'application/json'
          },
          // url: config.sendAzureNotificationURL,
          form: notifyData
        }, function (err, response, body) {
          console.log("@@@@@@@@@@@@######## ")
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

function failureHandler(data, res) {
  res.setHeader("statusCode", 400);
  res.status(400).json({
    status: "Failed",
    statusCode: 400,
    data: data
  });
}
//success handler
function successHandler(data, res) {
  res.setHeader("statusCode", 200);
  res.status(200).json({
    status: "Success",
    statusCode: 200,
    data: data
  });
}

//paginator 
function Paginator(items, page, per_page) {
  var page = page || 1,
    per_page = per_page || 10,
    offset = (page - 1) * per_page,

    paginatedItems = items.slice(offset).slice(0, per_page),
    total_pages = Math.ceil(items.length / per_page);
  return {
    page: page,
    per_page: per_page,
    pre_page: page - 1 ? page - 1 : null,
    next_page: (total_pages > page) ? page + 1 : null,
    total: items.length,
    total_pages: total_pages,
    data: paginatedItems
  };
}

module.exports = router;

