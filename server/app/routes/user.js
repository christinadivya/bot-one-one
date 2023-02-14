const router = require('express').Router();
const passport = require('passport');
const User = require('../../model/user');
const Chatroom = require('../../model/chatroom');
const Userroom = require('../../model/userroom');
const Notification = require('../../model/notification');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const filter = require('lodash/filter');
const intersectionWith = require('lodash/intersectionWith');
const differenceWith = require('lodash/differenceWith');
const isEqual = require('lodash/isEqual');
const _ = require('underscore');
const ChatrequestController = require('../controller/chatrequest');
const Message = require('../../model/message');
const Sync_contact = require('../../model/Sync_contact')
const config = require('../../model/DB_connection')
 // List all users except current users
router.get('/all', (req, res, next) => {
  let limit = parseInt(req.query.limit);
  let offset = 0;
  User.findAndCountAll({
    where:
      Sequelize.and(
        {
          DN_ID: { [Op.not]: req.query.userId }
        },
        {
          DN_ID: { [Op.not]: null }
        }
      ),
  })
    .then((data) => {
      let page = parseInt(req.query.page);
      let pages = Math.ceil(data.count / limit);
      offset = limit * (page - 1);
      let search = { $like: '%' + req.query.search + '%' }
      let search1 = { $like: req.query.search + '%' }
z
      User.findAll({
        where: Sequelize.or(
          Sequelize.and(
            {username: search }, {
              id: { [Op.not]: req.query.userId }
            }),
          Sequelize.and(
            { DC_EMAil: search1 }, {
              DN_ID: { [Op.not]: req.query.userId }
            })
        ),
        attributes: ['id', 'username', "email"],
        limit: limit,
        offset: offset,
        order: [["username", "ASC"]],
        raw: true
      }).then((users) => {

          let excludedCurrentUser = _.filter(users, function (currentObject) {
            return currentObject.DN_ID != req.query.userId;
          });
          res.setHeader("statusCode", 200);
          res.status(200).json({
            status: "Success",
            statusCode: 200,
            data: excludedCurrentUser,
            count: data.count, //data.count
            pages: pages //pages
          });
        });
    })
    .catch(next);
});

// chat notification
router.get('/chat_notification', (req, res, next) => {
  Notification.findAll({
    where: {
      TNOTIFICATION_LOGS_Receiver: req.query.userId,
      TNOTIFICATION_LOGS_Status: "Sent"
    },
    raw: true
  })
    .then((notifyRes) => {
      let notificationCount = _.size(notifyRes);
      res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200,
        data: notificationCount
      });
    });
});

// forward list API
router.get('/forward_list', (req, res, next) => {
  
  let UseriD = req.query.userId
  let searchQuery=req.query.search||""
  let limit = req.query.limit || 10
  let pageNumber = req.query.page || 1
  let offset = limit * (pageNumber - 1)
  if (req.query.search != undefined && req.query.search) {
    searchQuery = `'${req.query.search}'`
  } else {
    searchQuery = '""'
  }
 UseriD=`"${UseriD}"`
 let setQuery=`CALL my_logs(${limit},${offset},${searchQuery},${UseriD})`
 config.raw([setQuery]).then((response) => {
  if(response){
   var finalObject = JSON.parse(JSON.stringify(response[0]));
   let chatRoomIds=[]
   let logData=[]
   _.forEach(finalObject[1],function(data){
    chatRoomIds.push( data.TChat_Log_Chat_Room_ID)
    if(!data.TChat_Log_Is_userLeft){
      logData.push(data)

    }
   })

    Sync_contact.findAll({where:{
    userId:req.query.userId,
    appUserStatus:2,
    chatRoomId:{ $not:chatRoomIds }
  }}) .then((users) => {
 
    _.forEach(JSON.parse(JSON.stringify(users)),function(data){
data.HCHAT_ROOM_IS_Group=false
data.DC_USER_IMAGE=null
data.TChat_Log_Chat_Room_ID=data.chatRoomId

logData.push( data)
      
     })
// let searchResult
// let searchQuery=req.query.search
//      if (searchQuery) {
//             searchResult = _.filter(logData, function (p) {
//               if (p.name) {
//                 console.log(p)
//                 if (p.name.toUpperCase().includes(searchQuery.toUpperCase())) {
//                   return p
//                 }
//               } 
//               // else if (p.chatRoomLogs) {
//                 if (p.HCHAT_ROOM_Name.toUpperCase().includes(searchQuery.toUpperCase())) {
//                   return p
//                 }
//               // }
//             })
//           }else{
//             searchResult=logData
//           }
// let page=req.query.page||1
// let limit=req.query.limit||10
    //  let paginationResult = Paginator(logData, page, limit);
// console.log("@@@@@@@@@@@@@@@@@@@@",paginationResult)
    res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200,
        total_count: finalObject[0][0].counts, //data.count,
        page: pageNumber,//pages
        data: logData
      });
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

});


//update chat notification
router.put('/update_chat_notification', (req, res, next) => {
  Notification.update(
    {
      TNOTIFICATION_LOGS_Status: req.body.status
    }, {
      where: {
        TNOTIFICATION_LOGS_Receiver: req.body.userId,
        [Op.or]: [{ TNOTIFICATION_LOGS_Notification_Type: 'Request' }, { TNOTIFICATION_LOGS_Notification_Type: 'Message' }, { TNOTIFICATION_LOGS_Notification_Type: 'Accept' }]
     },
      raw: true
    })

    .then((notifyRes) => {
      // Message.update(
      //   {
      //       TMESSAGES_Read_Status: "Deliverd" //check user active status and update
      //   },{
      //   where: {
      //       TMESSAGES_Read_Status: {
      //           [Op.not]: 'Read'         
      //       },
      //       TMESSAGES_UID: req.body.userId,
      //       // TMESSAGES_Message_ID: msgRep.TMESSAGES_Message_ID
      //   },
      //       raw: true
      //   })
      //   .then((res) => {
      //   });


      // updateMessageStatus(req);
      res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200
      });
    });
});

//update message status
function updateMessageStatus(req) {
  Message.update(
    {
      TMESSAGES_Read_Status: req.query.status
    }, {
      where: {
        TMESSAGES_Chat_Room_ID: req.query.roomId
      },
      raw: true
    })
    .then((notifyRes) => {
    });
}

//group list
router.get('/group_list', (req, res, next) => {
  let limit = parseInt(req.query.limit);
  // User.findAndCountAll()
  //   .then((data) => {
      let page = parseInt(req.query.page);
      let search = { $like: '%' + req.query.search + '%' }
      let search1 = { $like: req.query.search + '%' }

      User.findAll({
        where: Sequelize.or(
          Sequelize.and(
            { username: search }, {
              id: { [Op.not]: req.query.userId }
            }),
          Sequelize.and(
            { email: search1 }, {
              id: { [Op.not]: req.query.userId }
            })
        ),

        attributes: ['id', 'username', "email"],
        order: [["username", "ASC"]],
        raw: true
      })
        .then((users) => {
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
            raw: true
          })
            .then((responseData) => {
              filterRoomUser(req, responseData, function (filteredUserData) {
                let excludedCurrentUser = _.filter(users, function (currentObject) {
                  return currentObject.DN_ID != req.query.userId;
                });
                let newContacts = removeDuplicatesUsers(filteredUserData, excludedCurrentUser);
                let paginationResult = Paginator(newContacts, page, limit);
                res.setHeader("statusCode", 200);
                res.status(200).json({
                  status: "Success",
                  statusCode: 200,
                  data: paginationResult.data,
                  count: paginationResult.total, //data.count
                  pages: paginationResult.total_pages //pages
                });
              });
            });
        // });
    })
    .catch(next);
});

// filter Room User
function filterRoomUser(req, data, callback) {
  if (data.length != 0) {
    let userData = JSON.parse(JSON.stringify(data));
    let itemsProcessed = 0;
    let contactsArray = [];
    let contactJson = {};

    for (var i = 0; i < userData.length; i++) {
      itemsProcessed++;
      let list = userData[i];
      let contactJson = {
        "id": list['chatRoomData.userRoomData.DN_ID'],
        "username": list['chatRoomData.userRoomData.DC_USERNAME'],
        // "DC_USER_IMAGE": list['chatRoomData.userRoomData.DC_USER_IMAGE'],
      }
      contactsArray.push(contactJson);
      if (itemsProcessed === userData.length) {
        callback(contactsArray);
      }
    };
  } else {
    callback(data);
  }
}
// user list for add member in group 
router.get('/UserlistToAdd', (req, res, next) => {
 
Userroom.findAll({
  where:{
  DUSER_ROOM_Chat_Room_ID:req.query.roomId,
  // DUSER_ROOM_UID:req.query.userId,
  DUSER_ROOM_IS_User_left:false
}
}).then(response=>{
   let userRoomdata=JSON.parse(JSON.stringify(response))
    let userids=[]
  _.forEach(userRoomdata,function(data){
 userids.push(data.DUSER_ROOM_UID)
  })

   let UseriD = req.query.userId
  let searchQuery=req.query.search||""
  let limit = req.query.limit || 10
  let pageNumber = req.query.page || 1
  let offset = limit * (pageNumber - 1)
  if (req.query.search != undefined && req.query.search) {
    searchQuery = `'${req.query.search}'`
  } else {
    searchQuery = '""'
  }
console.log(userids)
 UseriD=`"${UseriD}"`
  let setQuery=`CALL addUserToGroup(${limit},${offset},${searchQuery},${UseriD})`
 config.raw([setQuery]).then((response) => {
  if(response){

   var finalObject = JSON.parse(JSON.stringify(response[0]));
  let usersNotInProject = []
  // console.log(finalObject[0])
  _.forEach(finalObject[0], function(o) { 
    let loop=0
    for (var i=0; i<userids.length; i++){
        if (userids[i]===o.appUser){
      loop=1
        // }else{
         }
    }
    if(loop==0){
      usersNotInProject.push(o)
    }

  
 });
 let alpha='A'
let array=[]
let entity=[]

  _.groupBy(usersNotInProject, function(contact){ 
  if(contact.name.substr(0,1)==alpha){
  array.push(contact)
 }else{
    if(array.length!=0){
     entity.push(array)
   }
  array=[]
  array.push(contact)
alpha=contact.name.substr(0,1)
 }
});
 if(array.length!=0){
entity.push(array)
}
   res.setHeader("statusCode", 200);
      res.status(200).json({
        status: "Success",
        statusCode: 200,
        // total_count: entity.length, //data.count,
        limit:limit,
        page: pageNumber,//pages
        entity:entity,

       })
  }
  else{
    res.setHeader("statusCode", 200);
    res.status(200).json({
      status: "Success",
      statusCode: 200,
      page: pageNumber,//pages
      entity:[]
    })
    }
  })
});
})
// List all users excluded my contacts:
router.get('/list', (req, res, next) => {
  let limit = parseInt(req.query.limit);
 
      let page = parseInt(req.query.page);
      let search = { $like: '%' + req.query.search + '%' }
      let search1 = { $like: req.query.search + '%' }
console.log("5555555555555555",search)
      // let pages = Math.ceil(data.count / limit);
      // offset = limit * (page - 1);
      User.findAll({
        where: Sequelize.or(
          Sequelize.and(
            { username: search }, {
              id: { [Op.not]: req.query.userId }
            }
          ),
          Sequelize.and(
            { email: search1 }, {
              id: { [Op.not]: req.query.userId }
            }
          )
        ),
        attributes: ['id', 'username',  "email"],
        // limit: limit,
        // offset: offset,
        order: [["username", "ASC"]],
        raw: true
      })
        .then((users) => {
          ChatrequestController.getMyContactAndRequestedListNEW(req, res, next, function (responseData) {
            //filter current user
            let excludedCurrentUser = _.filter(users, function (currentObject) {
              return currentObject.DN_ID != req.query.userId;
            });

            let myContacts = responseData.filteredUserData;
            let newContacts = removeDuplicatesUsers(myContacts, excludedCurrentUser);
            let paginationResult = Paginator(newContacts, page, limit);

            res.setHeader("statusCode", 200);
            res.status(200).json({
              status: "Success",
              statusCode: 200,
              data: paginationResult.data,
              count: paginationResult.total, //data.count
              pages: paginationResult.total_pages //pages
            });
          });
        // });
    })
    .catch(next);
});

//remove Duplicate Users
function removeDuplicatesUsers(a, b) {
  for (var i = 0, len = a.length; i < len; i++) {
    for (var j = 0, len2 = b.length; j < len2; j++) {
      if (a[i] != undefined && b[j] != undefined) {
        if (a[i].DN_ID === b[j].DN_ID) {
          b.splice(j, 1);
          len2 = b.length;
        }
      }
    }
  }
  return b;
}

// Paginater
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
