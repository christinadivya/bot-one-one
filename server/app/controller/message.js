const router = require('express').Router();
const passport = require('passport');
const moment = require('moment');
const Chatroom = require('../../model/chatroom');
const Userroom = require('../../model/userroom');
const Chatlog = require('../../model/chatlog');
const User = require('../../model/user');
const Message = require('../../model/message');
const Document = require('../../model/document');
const Notification = require('../../model/notification');
const AppConfiguration = require('../../model/appconfiguration');
const path = require('path');
const fs = require('fs');
const dateFormat = require('dateformat');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const map = require('lodash/map');
const each = require('lodash/forEach');
const _ = require('underscore');
const MessageRecord = require('../../model/messageRecord')
const querystring = require('querystring');
const request = require('request');
const rp = require('request-promise');
const config = require('../../../config/configuration');
const UserDetails = require('../../model/userDetails');

const http = require('http');
const spauth = require('node-sp-auth');
const sprequest = require("sp-request");
const ftpClient = require('ftp-client');
const spsave = require("spsave").spsave;
const httpntlm = require('httpntlm');
const Sync_contact = require('../../model/Sync_contact')
module.exports = {

    // update instant read status 

    updateInstantReadStatus: function (onlinemembers, data, callback) {
        let request;
        console.log("!@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", data)
        Chatlog.find({
            where: {
                TChat_Log_Chat_Room_ID: data.chatRoomId
            },
            raw: true
        }).then((request_id) => {
            request = JSON.parse(JSON.stringify(request_id))
        Chatroom.findAll({
            where: {
                HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
            },
            include: [
                {
                    model: Userroom, as: 'chatRoomData'
                },
            ],
            raw: true
        })
            .then((chatRoomRes) => {
                let activeMembers = []
                let onlineUsers = []
                _.filter(chatRoomRes, function (roomObj) {
                    if (roomObj['chatRoomData.DUSER_ROOM_Active']) {
                        activeMembers.push(roomObj['chatRoomData.DUSER_ROOM_UID'])

                    } else {
                        _.forEach(onlinemembers, function (response) {
                            if (response.userId == roomObj['chatRoomData.DUSER_ROOM_UID']) {
                                onlineUsers.push(response)

                            }
                        })
                    }
                })
                if (activeMembers.length == chatRoomRes.length) {
                    Message.update({ TMESSAGES_Read_Status: "Read" }, {
                        where: {
                            TMESSAGES_Read_Status: { [Op.not]: 'Read' },
                            TMESSAGES_Chat_Room_ID: data.chatRoomId,

                        },
                        raw: true
                    })
                        .then((res) => {
                            callback(null, "Read",chatRoomRes)
                        })
                } else if (onlineUsers.length == chatRoomRes.length) {
                    Message.update({ TMESSAGES_Read_Status: "Delivered" }, {
                        where: {
                            TMESSAGES_Read_Status: { [Op.not]: 'Read' },
                            TMESSAGES_Chat_Room_ID: data.chatRoomId,

                        },
                        raw: true
                    })
                        .then((res) => {
                            console.log("@@@@@@@ null, Delivered,chatRoomRes")
                            callback(null, "Delivered",chatRoomRes)
                        })
                } else {
                    callback(null, "Sent",chatRoomRes)
                }
                let activeUsers = []
                let inactiveUsers = []
                _.filter(chatRoomRes, function (roomObj) {
                    if (roomObj['chatRoomData.DUSER_ROOM_Active']) {
                        activeUsers.push(roomObj['chatRoomData.DUSER_ROOM_UID'])

                    }


                    if (roomObj['chatRoomData.DUSER_ROOM_UID'] != data.userId&&roomObj['chatRoomData.DUSER_ROOM_IS_Mute'] != 1&&roomObj['chatRoomData.DUSER_ROOM_IS_User_left']==false) {

                        User.find({
                            where: {
                                id: data.userId,
                            }
                            
                        }).then(contact_detail => {

                            let user_Details_json = JSON.parse(JSON.stringify(contact_detail))
                            let notifUser = {}
                            let notification_type = 3
                            let isOnline = []

                            if (user_Details_json) {

                                if (user_Details_json.username) {
                                    notifUser = { "isMute": roomObj['chatRoomData.DUSER_ROOM_IS_Mute'], "name": user_Details_json.username, "userId": roomObj['chatRoomData.DUSER_ROOM_UID'], "request_id": request.TChat_Log_Request_ID }
                                    _.forEach(onlinemembers, function (response) {
                                        console.log(notifUser.userId, "****", response)
                                        if (response.userId == notifUser.userId) {
                                            isOnline.push(response)

                                        }

                                    })
                                    if (!roomObj['chatRoomData.DUSER_ROOM_Active']) {
                                        sendPushNotification(data, onlinemembers, notifUser, notification_type, callback)
                                    }
                                }
                            } else {

                                // User.find({ where: { id: roomObj['chatRoomData.DUSER_ROOM_UID'] } }).then(res => {
                                User.find({ where: { id: data.userId } }).then(res => {

                                    console.log("%%%%%%%%%%%%% mobile number%%%%%%%%%%%%", JSON.parse(JSON.stringify(res)))
                                    notifUser = { "isMute": roomObj['chatRoomData.DUSER_ROOM_IS_Mute'], "name": JSON.parse(JSON.stringify(res)).username, "userId": roomObj['chatRoomData.DUSER_ROOM_UID'], "request_id": request.TChat_Log_Request_ID  }
                                    //send only offline members
                                    _.forEach(onlinemembers, function (response) {
                                        if (response.userId == notifUser.userId) {
                                            isOnline.push(response)
                                        }
                                    })

                                    if ( !roomObj['chatRoomData.DUSER_ROOM_Active']) {
                                        sendPushNotification(data, onlinemembers, notifUser, notification_type, callback)

                                    }
                                })
                            }

                        })
                    }
                });
                // console.log(activeUsers.length, "!@#!", chatRoomRes.length)
                if (activeUsers.length == chatRoomRes.length) {
                    // Message.update({ TMESSAGES_Read_Status: "Read" }, {
                    //     where: {
                    //         TMESSAGES_Read_Status: { [Op.not]: 'Read' },
                    //         TMESSAGES_Chat_Room_ID: data.chatRoomId,

                    //     },
                    //     raw: true
                    // })
                    //     .then((res) => {
                    MessageRecord.update({ TMESSAGES_Record_Read_Status: 'Read' }, {
                        where: {
                            TMESSAGES_Record_Chat_Room_ID: data.chatRoomId,
                            TMESSAGES_Record_Read_Status: {
                                [Op.not]: 'Read'
                            }
                        },
                        raw: true
                    }).then((res) => { })
                    // })

                } else {
                    MessageRecord.update({ TMESSAGES_Record_Read_Status: 'Read' }, {
                        where: {
                            TMESSAGES_Record_Chat_Room_ID: data.chatRoomId,
                            TMESSAGES_Record_UID: { $in: activeUsers },
                            TMESSAGES_Record_Read_Status: {
                                [Op.not]: 'Read'
                            }
                        },
                        raw: true
                    }).then((res) => {

                    })

                }
               
            })
        })
    },

    //update message Stutus
    updateMessageStatus: function (data, callback) {
        console.log("*&&&&&&&&&&&&&&&&***************", data)
        MessageRecord.update({ TMESSAGES_Record_Read_Status: 'Read' }, {
            where: {
                TMESSAGES_Record_Chat_Room_ID: data.chatRoomId,
                TMESSAGES_Record_UID: data.userId,
                TMESSAGES_Record_Read_Status: {
                    [Op.not]: 'Read'
                }
            },
            raw: true
        }).then((res) => {
            MessageRecord.findAll({
                where: {
                    TMESSAGES_Record_Chat_Room_ID: data.chatRoomId,
                    // TMESSAGES_Read_Status:'Read'
                    [Op.or]: [{ TMESSAGES_Record_Read_Status: 'Sent' }, { TMESSAGES_Record_Read_Status: 'Delivered' }]

                }
            }).then(res => {
                // console.log("##$$$$$$$$$$$$$$$$$$$$$ $ update message stasts deliverd and sent status is ",res)
                if (res.length == 0) {
                    Message.update({ TMESSAGES_Read_Status: "Read" }, {
                        where: {
                            TMESSAGES_Read_Status: { [Op.not]: 'Read' },
                            TMESSAGES_Chat_Room_ID: data.chatRoomId
                        },
                        raw: true
                    }).then((res) => { });
                }
            })

        });
    },
    //dalete message 
    deleteMessage: function (data, callback) {
        let input = data;
        var lastMsg = { TMESSAGES_Record_Created_date: moment().utc().format("YYYY-MM-DD") }
        // console.log("@111@@@@@@@@@", input)
        let deleteMessage = {}
        if (input.deleteForEveryOne == true || input.deleteForEveryOne == "true" || input.deleteForEveryOne == 1) {
input.deleteForEveryOne=true
            deleteMessage = {
                TMESSAGES_Record_Chat_Room_ID: input.roomId,
                TMESSAGES_Record_Message_ID: { $in: input.messageId }
            }
        } else {
            input.deleteForEveryOne=false

            deleteMessage = {
                TMESSAGES_Record_Chat_Room_ID: input.roomId,
                TMESSAGES_Record_UID: input.userId,
                TMESSAGES_Record_Message_ID: { $in: input.messageId }
            }
        }
        console.log("################################", deleteMessage)

        MessageRecord.update({ TMESSAGES_Record_IS_Delete: true }, {
            where: deleteMessage,
            raw: true
        }).then((resp) => {
            MessageRecord.find({
                where: {
                    TMESSAGES_Record_Chat_Room_ID: data.roomId,
                    TMESSAGES_Record_UID: data.userId,
                    TMESSAGES_Record_IS_Delete: false
                },
                order: [
                    ['TMESSAGES_Record_Message_ID', 'DESC'], //ASC 
                ],
            }).then((foundMessages) => {
console.log(foundMessages)
                if (foundMessages) {

                    lastMsg = JSON.parse(JSON.stringify(foundMessages))//foundMessages[foundMessages.length - 1];
                    console.log(lastMsg,input.deleteForEveryOne,"###########   foundMessages #####################", deleteMessage)

                    if (input.deleteForEveryOne==true) {

                        Chatlog.update({ TChat_Log_Message_ID: lastMsg.TMESSAGES_Record_Message_ID }, {
                            where: {
                                TChat_Log_Chat_Room_ID: data.roomId,
                            }
                        }).then(res => { })

                    } else {
                        Chatlog.update({ TChat_Log_Message_ID: lastMsg.TMESSAGES_Record_Message_ID }, {
                            where: {
                                TChat_Log_Chat_Room_ID: data.roomId,
                                TChat_Log_Sender: data.userId
                            }
                        }).then(res => { })
                    }

                }
                else {
                    Chatlog.update({ TChat_Log_Message_ID: null }, {
                        where: {
                            TChat_Log_Chat_Room_ID: data.roomId,
                            TChat_Log_Sender: data.userId
                        }
                    }).then(res => { })
                }
            });
            //Clear specific file in document
            if (data.istype == "video" || data.istype == "PDF" || data.istype == "image") {
                Message.findAll({
                    where: { TMESSAGES_Message_ID: data.messageId },
                    raw: true
                }).then((msgRespData) => {
                    if (msgRespData.length != 0) {
                        Document.update({ TDOCUMENTS_IS_Delete: true }, {
                            where: { TDOCUMENTS_Document_ID: msgRespData[0].TMESSAGES_Document_ID }
                        }).then((updatedRes) => {
                        });
                    }
                });
            }

            //Update today indicator

            return MessageRecord.find({
                where: {
                    TMESSAGES_Record_Created_date: lastMsg.TMESSAGES_Record_Created_date,
                    TMESSAGES_Record_IS_Delete: false,
                    TMESSAGES_Record_UID: input.userId
                },
                order: [
                    ['TMESSAGES_Record_Message_ID', 'ASC'], //ASC 
                ],
            }).then((todaysMessage) => {
                // console.log("@%%%%%%%%%%",JSON.parse(JSON.stringify(todaysMessage)))

                if (todaysMessage.length > 0) {
                    let updateTodayIndicator = { TMESSAGES_Record_Message_ID: todaysMessage.TMESSAGES_Record_Message_ID, TMESSAGES_Record_Chat_Room_ID: input.roomId }
                    if (input.deleteForEveryOne != true) {
                        updateTodayIndicator.TMESSAGES_Record_UID = input.userId
                    }
                    return MessageRecord.update({ TMESSAGES_Today_First_message: true }, {
                        where: updateTodayIndicator,
                        raw: true
                    }).then((resp) => { })
                }

            })

        }).then(messageresponse => {
            callback(true, messageresponse);

        });
        // }
    },
    // update room msg status 
    updateRoomMessageStatus: function (data, status, callback) {
        Message.findAll({
            where: data,
            raw: true
        }).then((msgResp) => {
            let updateQuery = {
                TMESSAGES_Read_Status: status,
            }
            if (msgResp) {
                Message.update(updateQuery, {
                    where: data
                }).then((chatReqUpdatedResponse) => {
                    callback(chatReqUpdatedResponse)
                })

                MessageRecord.update({ TMESSAGES_Record_Read_Status: status }, {
                    where: data,
                    raw: true
                }).then((res) => {
                    // callback(chatRoomRes);
                });

            }
        });
    },
    // to get users in room 
    getRoomUsers: function (data, callback) {
        Userroom.findAll({
            where: {
                DUSER_ROOM_Chat_Room_ID: data.chatRoomId
            },
            raw: true
        }).then((userRoomRes) => {
            let roomMembers = _.filter(userRoomRes, function (roomUserObj) {
                // if(roomUserObj.DUSER_ROOM_UID != data.userId){
                if (data.userId != roomUserObj.DUSER_ROOM_UID) {
                    return roomUserObj;
                }
            });
            // console.log("****************************", data)
            _.forEach(roomMembers, function (receiver) {
                let notifyJson = {
                    // roomname: receiver.roomname,
                    username: data.username,
                    msg: data.msg,
                    // hasMsg: data.hasMsg,
                    hasFile: data.hasFile,
                    msgTime: data.msgTime,
                    isGroup: data.isGroup,
                    userId: data.userId,
                    chatRoomId: receiver.DUSER_ROOM_Chat_Room_ID,
                    istype: data.istype,
                    isForward: true,
                    thumbnail: data.thumbnail,
                    filename: data.filename,
                    dazzId: data.dazzId,//"8664e761-a35a-4b11-9229-81f29bdfb32c",
                    contact_name: data.contact_name,
                    contact_number: data.contact_number,
                    lat: data.lat,
                    long: data.long,
                    nynm: data.nynm,
                    nynm_short: data.nynm_short,
                    buxs: data.buxs



                }

                // notifyRoomUser(notifyJson, null);
                data['isBroad'] = false;
                createMessageAndLogs(onlineMember, notifyJson, callback);
            });
            callback(userRoomRes)
        })

    },

    //send message to user farword 
    sendMessageToUsers: function (onlineMember, data, callback) {
        // console.log("@@@@@@@@@@@@@@@@@@@@",data)
        _.forEach(data.users, function (receiver) {
            let notifyJson = {
                roomname: receiver.roomname,
                username: data.username,
                msg: data.msg,
                // hasMsg: data.hasMsg,
                hasFile: data.hasFile,
                msgTime: data.msgTime,
                isGroup: data.isGroup,
                userId: data.userId,
                chatRoomId: receiver.chatRoomId,
                istype: data.istype,
                isForward: true,
                thumbnail: data.thumbnail,
                filename: data.filename,
                dazzId: data.dazzId,//"8664e761-a35a-4b11-9229-81f29bdfb32c",
                contact_name: data.contact_name,
                contact_number: data.contact_number,
                lat: data.lat,
                long: data.long,
                nynm: data.nynm,
                nynm_short: data.nynm_short,
                buxs: data.buxs
            }
            Chatroom.findAll({ where: { HCHAT_ROOM_Chat_Room_ID: receiver.chatRoomId, HCHAT_ROOM_Is_Broadcast: true } })
                .then(chatRoomDetails => {
                    // console.log(chatRoomDetails, "###################################%%%%%%%%%%%%%%%%%%%%%%%%%%")
                    //if farward room is broadcast means its happened
                    if (chatRoomDetails.length != 0) {
                        sendBroadcast(onlineMember, notifyJson, callback)

                    } else {
                        data['isBroad'] = false;
                        createMessageAndLogs(onlineMember, notifyJson, callback);

                    }
                })


            // notifyRoomUser(notifyJson, null);
        });
    },
    //forword broadcast message json
    createBroadcastMessage(onlineMember, data, callback) {
        sendBroadcast(onlineMember, data, callback)
    },


    // create Message initially 
    createMessage: function (onlineMember, data, callback) {
        // notifyRoomUser(data, onlineMember);
        // data['isForward'] = false;
        // data['isBroad'] = false;
        // Chatroom.findAll({ where: { HCHAT_ROOM_Chat_Room_ID: data.chatRoomId, HCHAT_ROOM_Is_Broadcast: true } })
        //     .then(chatRoomDetails => {

        //         if (chatRoomDetails.length != 0) {
        //             data['isBroad'] = true
        //             data['broad_room_id'] = data.chatRoomId;
        //             data['broad_receiverId'] = data.userId
        //             createMessageAndLogs(onlineMember, data, callback);

        //         } else {
        //             data['isBroad'] = false;
        //             createMessageAndLogs(onlineMember, data, callback);

        //         }

        //     })
            data['isForward'] = false;
        Chatroom.findAll({ where: { HCHAT_ROOM_Chat_Room_ID: data.chatRoomId, HCHAT_ROOM_Is_Broadcast: true } })
            .then(chatRoomDetails => {
                if (chatRoomDetails.length != 0) {
                    // sendBroadcast(onlineMember, data, callback)
                    data['isBroad'] = true
                    data['broad_room_id'] = data.userId;
                    data['broad_receiverId'] = data.chatRoomId
                    createMessageAndLogs(onlineMember, data, callback);

                } else {
                    data['isBroad'] = false;
                    createMessageAndLogs(onlineMember, data, callback);

                }
            })

    },

    //upload file to chat group and private
    uploadFileToChat: function (onlineMember, files, data, imgSrcString, callback) {
        data['isForward'] = false;
        sharePointUpload(files, imgSrcString, data, function (er, res) {
            if (res.status == 200) {
                data.msg = res.image;
                createMessageAndLogs(onlineMember, data, callback);
                callback(er, {
                    upload: true,
                    data: data,
                    token: res.token
                });
            } else {
                callback(er, {
                    upload: false,
                    data: res,
                    token: res.token
                })
            }
        });
    },

    //send files to chat 
    sendFilesToChat: function (onlineMember, files, data, callback) {
        data['isForward'] = false;
        Chatroom.findAll({ where: { HCHAT_ROOM_Chat_Room_ID: data.chatRoomId, HCHAT_ROOM_Is_Broadcast: true } })
            .then(chatRoomDetails => {
                if (chatRoomDetails.length != 0) {
                    // sendBroadcast(onlineMember, data, callback)
                    data['isBroad'] = true
                    data['broad_room_id'] = data.userId;
                    data['broad_receiverId'] = data.chatRoomId
                    createMessageAndLogs(onlineMember, data, callback);

                } else {
                    data['isBroad'] = false;
                    createMessageAndLogs(onlineMember, data, callback);

                }
            })
    },

    // update previous log and create date 
    updatePreviousLogAndCreateData(data, callback) {
        let chatLogInput = {
            "TChat_Log_Status": "Message",
            "TChat_Log_Chat_Request_ID": 0,
            "TChat_Log_Chat_Room_ID": data.chatRoomId,
            "TChat_Log_Sender": data.userId,

        };
        callback(null, dataObj);
 }
}
//create broadcast message
function sendBroadcast(onlineMember, data, callback) {

    Chatroom.findAll({
        where: {
            HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
        },
        include: [{ model: Userroom, as: 'chatRoomData' }],
        raw: true
    }).then((chatRoomRes) => {

        //send broadcast message to broadcast room

        SendbroadcastMessage(data.userId, onlineMember, data.chatRoomId, data, data.chatRoomId, callback)

        _.forEach(chatRoomRes, function (userRoom) {
            // console.log("userRoom",userRoom, data.userId)
            if (userRoom['chatRoomData.DUSER_ROOM_UID'] != data.userId) {
                let receiverId = userRoom['chatRoomData.DUSER_ROOM_UID']
                let roomId = userRoom['chatRoomData.DUSER_ROOM_BroadCast_roomId']
                // console.log("userRoom 1234@@@@@@@@@@2 22222222222",roomId)

                //send broadcast message to individual room


                SendbroadcastMessage(receiverId, onlineMember, roomId, data, data.chatRoomId, callback)

            }
        })

        // userMessage.TMESSAGES_Record_UID = userId
        // MessageRecord.create(userMessage).then(res => { })
    });
}
// notify room user 
function notifyRoomUser(data, onlineMember, msgRep) {

    console.log("&&&&&&&&&   onlineMember &&&&&&&&&&")
    Userroom.findAll({
        where: {
            DUSER_ROOM_Chat_Room_ID: data.chatRoomId
        },
        raw: true
    })
        .then((userRoomRes) => {

            if (userRoomRes.length != 0) {
                let roomMembers = _.filter(userRoomRes, function (roomUserObj) {
                    // if(roomUserObj.DUSER_ROOM_UID != data.userId){
                    if (!roomUserObj.DUSER_ROOM_Active) {
                        return roomUserObj;
                    }
                });
                for (var i = 0; i < roomMembers.length; i++) {
                    let userList = roomMembers[i];
                    var picked = []
                    picked = _.filter(onlineMember, { 'userId': userList.DUSER_ROOM_UID });
                    if (picked.length == 0) {

                        let createNotJson = {
                            TNOTIFICATION_LOGS_Notification_Type: "Message",
                            TNOTIFICATION_LOGS_Message: data.msg,
                            TNOTIFICATION_LOGS_Sender: data.userId,
                            TNOTIFICATION_LOGS_Receiver: userList.DUSER_ROOM_UID,
                            TNOTIFICATION_LOGS_Chat_Room_ID: data.chatRoomId
                        }
                    } else {
                        let userIds = _.forEach(picked, function (userId) {
                            return userId.userId
                        })

                        MessageRecord.update({ TMESSAGES_Record_Read_Status: 'Delivered' }, {
                            where: {
                                TMESSAGES_Record_Chat_Room_ID: data.chatRoomId,
                                TMESSAGES_Record_UID: { $in: userIds },
                                TMESSAGES_Record_Read_Status: {
                                    [Op.not]: 'Read'
                                }
                            },
                            raw: true
                        }).then((res) => {
                            MessageRecord.findAll({
                                where: {
                                    TMESSAGES_Record_Chat_Room_ID: data.chatRoomId,
                                    TMESSAGES_Record_Read_Status: 'Sent'
                                }
                            }).then(res => {
                                if (res.length == 0) {
                                    Message.update({ TMESSAGES_Read_Status: "Delivered" }, {
                                        where: {
                                            TMESSAGES_Read_Status: { [Op.not]: 'Read' },
                                            TMESSAGES_Chat_Room_ID: data.chatRoomId
                                        },
                                        raw: true
                                    }).then((res) => { });
                                }
                            })
                        });
                    }
                }
            }
        });
}

// send  notification 
function Send_Notification(data, dataObj, msgRep) {

    Notification.findAll({
        where: {
            TNOTIFICATION_LOGS_Notification_Logs_ID: dataObj.TNOTIFICATION_LOGS_Notification_Logs_ID
        },
        include: [
            { model: User, as: 'notificationReceiver' },
            { model: User, as: 'notificationSender' }
        ],
    })
        .then((notifyResp) => {
            if (notifyResp.length != 0) {
                let receiverUserDetails = notifyResp[0].notificationReceiver;
                let senderUserDetails = notifyResp[0].notificationSender;
                let messageContent;
                let notifyData;
                if (data.istype == "image") {
                    messageContent = '📷 Image';
                } else if (data.istype == "PDF") {
                    messageContent = "📎 Attachment";
                } else if (data.istype == "video") {
                    messageContent = "📹 Video";
                } else {
                    messageContent = dataObj.TNOTIFICATION_LOGS_Message;
                }

                if (data.isGroup) {
                    notifyData = {
                        "Receiver": receiverUserDetails.id,
                        "NotificationType": "Message",
                        "NotificationValue": data.chatRoomId,
                        "Message": senderUserDetails.DC_USERNAME + ": " + messageContent,
                        //   "NotificationId": dataObj.TNOTIFICATION_LOGS_Notification_Logs_ID,
                        "Sender": data.roomname
                    }
                } else {
                    notifyData = {
                        "Receiver": receiverUserDetails.id,
                        "NotificationType": "Message",
                        "NotificationValue": data.chatRoomId,
                        "Message": messageContent,
                        //   "NotificationId": dataObj.TNOTIFICATION_LOGS_Notification_Logs_ID,
                        "Sender": senderUserDetails.DC_USERNAME
                    }
                }
                request.post({
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // url: config.sendAzureNotificationURL,
                    form: notifyData
                }, function (err, response, body) {
                    console.log(err)
                    console.log(body)
                    console.log(response.statusCode)

                    if (response.statusCode == 200) {
                        updateNotificationStatus("Sent", dataObj, data, msgRep);
                    } else {
                        updateNotificationStatus("Failed", dataObj, data, msgRep);
                    }
                });
            }
        });
}

// update notification status
function updateNotificationStatus(notStatus, dataObj, data, msgRep) {
    Chatroom.findAll({
        where: {
            HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
        },
        include: [
            {
                model: Userroom, as: 'chatRoomData'
            },
        ],
        raw: true
    })
        .then((chatRoomRes) => {

            let roomMembers = _.filter(chatRoomRes, function (roomObj) {

                if (roomObj['chatRoomData.DUSER_ROOM_UID'] != data.userId) {
                    if (roomObj['chatRoomData.DUSER_ROOM_Active']) { return roomObj; }
                }
            });
            let userStatusData;
            if (roomMembers.length != 0) {
                userStatusData = "Read"; //active => Read
            } else {
                userStatusData = "Delivered"; //inactive => Delivered
            }

        })
}

function SendbroadcastMessage(userId, onlineMember, roomid, data, myroomId, callback) {

    let notifyJson = {
        roomname: roomid,
        username: data.username,
        msg: data.msg,
        // hasMsg: data.hasMsg,
        hasFile: data.hasFile,
        msgTime: data.msgTime,
        isGroup: data.isGroup,
        userId: data.userId,
        chatRoomId: roomid,
        istype: data.istype,
        isForward: true,
        thumbnail: data.thumbnail,
        filename: data.filename,
        dazzId: data.dazzId,//"8664e761-a35a-4b11-9229-81f29bdfb32c",
        contact_name: data.contact_name,
        contact_number: data.contact_number,
        lat: data.lat,
        long: data.long,
        dazzId: data.dazzId,
        nynm: data.nynm,
        nynm_short: data.nynm_short,
        buxs: data.buxs,
        broad_room_id: myroomId,
        broad_receiverId: data.userId,
        isBroad: true
    }

    // notifyRoomUser(notifyJson, null);
    //  createBroadcastMessageAndLogs(userId,onlineMember, notifyJson, myroomId, callback);

    createMessageAndLogs(onlineMember, notifyJson, callback);


}


function createBroadcastMessageAndLogs(receiverId, onlineMember, data, myroomId, callback) {
    // console.log(data)
    let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
    Chatlog.findAll(
        {
            where: { "TChat_Log_Chat_Room_ID": data.chatRoomId },
        }).then(res => {

            if (res && res.length > 0) {
                Chatlog.update({
                    TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    TChat_Log_Initiated: false,
                    TChat_Log_IS_Archive: false,
                    TChat_Log_Is_User_Delete: false
                }, {
                        where: {
                            TChat_Log_Sender: receiverId,
                            TChat_Log_Chat_Room_ID: data.chatRoomId,
                        }
                    }).then(res => { })
            } else {
                Chatroom.findAll({
                    where: {
                        HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
                    },
                    include: [
                        {
                            model: Userroom, as: 'chatRoomData'
                        },
                    ],
                    raw: true
                })
                    .then((chatRoomRes) => {

                        let chatLogInput = {
                            "TChat_Log_Chat_Request_ID": 0,
                            "TChat_Log_Sender": data.userId,
                            "TChat_Log_Receiver": null,
                            "TChat_Log_Chat_Room_ID": data.chatRoomId,
                            "TChat_Log_Status": "Message",
                            "TChat_Log_Updated_On": new Date().toISOString().slice(0, 19).replace('T', ' ')
                        };
                        let receiverUser
                        _.forEach(chatRoomRes, function (chatRoomRes) {

                            if (data.userId != chatRoomRes['chatRoomData.DUSER_ROOM_UID']) {

                                chatLogInput.TChat_Log_Sender = chatRoomRes['chatRoomData.DUSER_ROOM_UID']
                                chatLogInput.TChat_Log_Receiver = data.userId
                                Chatlog.create(chatLogInput).then((chatLogResponse) => { });
                            } else {
                                chatLogInput.TChat_Log_Sender = data.userId
                                chatLogInput.TChat_Log_Receiver = chatRoomRes['chatRoomData.DUSER_ROOM_UID']
                                Chatlog.create(chatLogInput).then(res => { });
                            }
                        });

                    });
            }
        })


    if (data.hasFile) {
        let createMsgJson = {
            TMESSAGES_Content: data.msg,
            TMESSAGES_UID: data.userId,
            TMESSAGES_Chat_Room_ID: data.chatRoomId,
            TMESSAGES_File_Type: data.istype,
            TMESSAGES_File_Name: data.filename,
            TMESSAGES_Thumbnail_Url: data.thumbnail,
            TMESSAGES_IS_BroadCast: true
            // TMESSAGES_Mobile_dateTime:data.msgTime
        }

        let docJson = {
            TDOCUMENTS_Document_Type: data.istype,
            TDOCUMENTS_Document_Name: data.filename,
            TDOCUMENTS_Document_Path: data.msg,
            TDOCUMENTS_Uid: data.userId,
            TDOCUMENTS_Chat_Room_ID: data.chatRoomId,
            TDOCUMENTS_Thumbnail_Url: data.thumbnail
        }

        Document.create(docJson).then((docResp) => {
            createMsgJson['TMESSAGES_Document_ID'] = docResp.TDOCUMENTS_Document_ID;
            createMsgJson['TMESSAGES_Created_On'] = new Date().toISOString().slice(0, 19).replace('T', ' ')
            createMsgJson['TMESSAGES_Updated_On'] = new Date().toISOString().slice(0, 19).replace('T', ' ')

            // createBroadcastRoomMessage(receiverId, onlineMember, createMsgJson, data, myroomId, callback);
        });
    } else {
        console.log(data.istype)
        let createMsgJson = {
            TMESSAGES_Content: data.msg,
            TMESSAGES_UID: data.userId,
            TMESSAGES_Chat_Room_ID: data.chatRoomId,
            TMESSAGES_Created_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
            TMESSAGES_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
            TMESSAGES_IS_BroadCast: true,
            TMESSAGES_File_Type: data.istype

            // TMESSAGES_Mobile_dateTime:data.msgTime
        }
        if (data.istype == "contact") {
            createMsgJson.TMESSAGES_Contact_name = data.contact_name,

                createMsgJson.TMESSAGES_Contact_number = data.contact_number
        }
        if (data.istype == "location") {
            createMsgJson.TMESSAGES_Lat = data.lat,

                createMsgJson.TMESSAGES_Long = data.long

        }
        if (data.istype == "dazz") {
            createMsgJson.TMESSAGES_IS_Dazz_id = data.dazzId
        }
        if (data.istype == "nynm") {
            createMsgJson.TMESSAGES_IS_Nynm_string = data.nynm
            createMsgJson.TMESSAGES_IS_Nynm_short_string = data.nynm_short

        }
       }
}
function createBroadcastRoomMessage(receiverId, onlineMember, createmessage, data, myroomId, callback) {
    // createMsgJson.TMESSAGES_Chat_Room_ID= myroomId

    let docId = createmessage.TMESSAGES_Document_ID
    let today = moment().utc().format("YYYY-MM-DD")
    let message_Record = {

        TMESSAGES_Record_Chat_Room_ID: createmessage.TMESSAGES_Chat_Room_ID,
        TMESSAGES_Record_Read_Status: createmessage.TMESSAGES_Read_Status,
        TMESSAGES_Record_Content: createmessage.TMESSAGES_Content,
        TMESSAGES_Record_Created_date: today,
        TMESSAGES_Record_UID: createmessage.TMESSAGES_UID,
        TMESSAGES_Record_Read_Status: "Read"
    }
    createmessage.TMESSAGES_Created_date = today;
    Message.find({
        where: {
            [Op.and]: [
                { TMESSAGES_Created_date: today },
                { TMESSAGES_Today_First_message: true },
                { TMESSAGES_IS_Delete: false }
            ],
            TMESSAGES_Chat_Room_ID: myroomId,
        },
    }).then(msgdata => {

        if (!msgdata) {
            createmessage.TMESSAGES_Today_First_message = true;
            message_Record.TMESSAGES_Record_Today_First_message = true

        } else {
            createmessage.TMESSAGES_Today_First_message = false;
        }
        createmessage.TMESSAGES_Chat_Room_ID = myroomId
        createmessage.TMESSAGES_Document_ID = docId
        // console.log(receiverId,data.chatRoomId,myroomId,"!!!!!!!!!!!!!",createmessage,docId)

        Message.create(createmessage).then((msgRep) => {
            let createdMessage = JSON.parse(JSON.stringify(msgRep))

            if ((createdMessage.TMESSAGES_File_Type == "text" || createdMessage.TMESSAGES_File_Type == "Text")&&!data.isBux) {
                // nlpKeword(createdMessage, data.userId)
            }
            message_Record.TMESSAGES_Record_Message_ID = JSON.parse(JSON.stringify(msgRep)).TMESSAGES_Message_ID,

                MessageRecord.create(message_Record).then(res => {
                    // callback(null, JSON.parse(JSON.stringify(msgRep)));
                    data.chatRoomId = myroomId
                    createMessageRecordLogs(data, JSON.parse(JSON.stringify(msgRep)), true, function (callback) {

                    })
                })


            Chatlog.update({
                TChat_Log_IS_Delete: false,
                TChat_Log_Is_User_Delete: false,
                TChat_Log_Initiated: false,
                TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                TChat_Log_Message_ID: msgRep.TMESSAGES_Message_ID
            }, {
                    where: {

                        TChat_Log_Chat_Room_ID: myroomId,
                        TChat_Log_Sender: receiverId
                    }
                }).then(res => { })


        })
    })
}

// create message and logs function
function createMessageAndLogs(onlineMember, data, callback) {
    let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
    Chatlog.findAll(
        {
            where: { "TChat_Log_Chat_Room_ID": data.chatRoomId },
        }).then(res => {

            if (res && res.length > 0) {
                if (data.isBroad != true) {
                    Chatlog.update({
                        // TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        TChat_Log_Initiated: false,
                        TChat_Log_IS_Archive: false,
                        TChat_Log_Is_User_Delete: false
                    }, {
                            where: {
                                TChat_Log_Chat_Room_ID: data.chatRoomId,
                            }
                        }).then(res => { })
                }
            } else {
                Chatroom.findAll({
                    where: {
                        HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
                    },
                    include: [
                        {
                            model: Userroom, as: 'chatRoomData'
                        },
                    ],
                    raw: true
                })
                    .then((chatRoomRes) => {

                        let chatLogInput = {
                            "TChat_Log_Chat_Request_ID": 0,
                            "TChat_Log_Sender": data.userId,
                            "TChat_Log_Receiver": null,
                            "TChat_Log_Chat_Room_ID": data.chatRoomId,
                            "TChat_Log_Status": "Message",
                            "TChat_Log_Updated_On": new Date().toISOString().slice(0, 19).replace('T', ' ')
                        };
                        let receiverUser
                         chatLogInput.TChat_Log_Sender = chatRoomRes[1]['chatRoomData.DUSER_ROOM_UID']
                        chatLogInput.TChat_Log_Receiver = chatRoomRes[0]['chatRoomData.DUSER_ROOM_UID']
                        Chatlog.create(chatLogInput).then((chatLogResponse) => { });

                        chatLogInput.TChat_Log_Sender = chatRoomRes[0]['chatRoomData.DUSER_ROOM_UID']
                        chatLogInput.TChat_Log_Receiver = chatRoomRes[1]['chatRoomData.DUSER_ROOM_UID']
                        Chatlog.create(chatLogInput).then(res => { });
 
                    });
            }
        })

    if (data.hasFile) {
        let createMsgJson = {
            TMESSAGES_Content: data.msg,
            TMESSAGES_UID: data.userId,
            TMESSAGES_Chat_Room_ID: data.chatRoomId,
            TMESSAGES_File_Type: data.istype,
            TMESSAGES_File_Name: data.filename,
            TMESSAGES_Thumbnail_Url: data.thumbnail,
            TMESSAGES_IS_BuxS: data.buxs
            // TMESSAGES_Mobile_dateTime:data.msgTime

        }

        let docJson = {
            TDOCUMENTS_Document_Type: data.istype,
            TDOCUMENTS_Document_Name: data.filename,
            TDOCUMENTS_Document_Path: data.msg,
            TDOCUMENTS_Uid: data.userId,
            TDOCUMENTS_Chat_Room_ID: data.chatRoomId,
            TDOCUMENTS_Thumbnail_Url: data.thumbnail
        }

        Document.create(docJson).then((docResp) => {
            createMsgJson['TMESSAGES_Document_ID'] = docResp.TDOCUMENTS_Document_ID;
            createMsgJson['TMESSAGES_Created_On'] = new Date().toISOString().slice(0, 19).replace('T', ' ')
            createMsgJson['TMESSAGES_Updated_On'] = new Date().toISOString().slice(0, 19).replace('T', ' ')

            createRoomMessage(onlineMember, createMsgJson, data, callback);
        });
    } else {
        let createMsgJson = {
            TMESSAGES_Content: data.msg,
            TMESSAGES_UID: data.userId,
            TMESSAGES_Chat_Room_ID: data.chatRoomId,
            TMESSAGES_Created_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
            TMESSAGES_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
            TMESSAGES_File_Type: data.istype,
            TMESSAGES_IS_BuxS: data.buxs
        }
        if (data.istype == "contact") {
            createMsgJson.TMESSAGES_Contact_name = data.contact_name,
                createMsgJson.TMESSAGES_Contact_number = data.contact_number
        }
        if (data.istype == "location") {
            createMsgJson.TMESSAGES_Lat = data.lat,
                createMsgJson.TMESSAGES_Long = data.long
        }
        if (data.istype == "dazz") {
            createMsgJson.TMESSAGES_IS_Dazz_id = data.dazzId
        }
        if (data.istype == "nynm") {
            createMsgJson.TMESSAGES_IS_Nynm_string = data.nynm
            createMsgJson.TMESSAGES_IS_Nynm_short_string = data.nynm_short
        }
        createRoomMessage(onlineMember, createMsgJson, data, callback);
    }
}
//send notification
function sendPushNotification(data, onlineMember, receiver, notification_type, callback) {
    console.log("@!!!!! nodtification sendPushNotification !!!",receiver,data.roomname)
    if (data.istype == "image") {
        messageContent = '📷 Image';
    } else if (data.istype == "PDF") {
        messageContent = "📎 Attachment";
    } else if (data.istype == "video") {
        messageContent = "📹 Video";
    } else {
        messageContent = data.msg;
    }
let notifyData={}
    if (data.isGroup) {

        notifyData = {
            "sender": data.userId,
            "sender_name": receiver.name,
            "receiver_id": parseInt(receiver.userId),
            "message": messageContent,
            "notification_type": 17,
            "room_id": data.chatRoomId,
            "roomname": data.roomname,
            "request_id": receiver.request_id
        }

    } else {

        notifyData = {
            "sender": data.userId,
            "sender_name": receiver.name,
            "receiver_id": parseInt(receiver.userId),
            "message": messageContent,
            "notification_type": 17,
            "room_id": data.chatRoomId,
            "roomname": data.roomname,
            "request_id": receiver.request_id
        }

    }
console.log("!!!!!!!!!!!!!!! notification body @@@@@@@@@@@@@@@@@@@",notifyData)
    rp({
        url: 'http://13.126.155.93:9001/api/auth/chat_notification',
        'Content-type': 'application/json',

        method: 'POST',
        json: true,
        body: notifyData
    })
        .then((response) => {
            console.log("%%%jbjgfb")
            console.log(response.data.status);
            if (response.data.status == 200 && receiver.isMute == 0 || receiver.isMute == false) {
                MessageRecord.update({ TMESSAGES_Record_Read_Status: "Delivered" }, {
                    where: {
                        TMESSAGES_Record_Chat_Room_ID: data.chatRoomId,
                        TMESSAGES_Record_UID: receiver.userId,
                        TMESSAGES_Record_Read_Status: "Sent"
                    }
                }
                ).then(res => {
                    MessageRecord.findAll({
                        where: {
                            TMESSAGES_Record_Chat_Room_ID: data.chatRoomId,
                            // TMESSAGES_Record_UID:{ [Op.eq]:data.userId},
                            TMESSAGES_Record_Read_Status: "Sent"
                        }
                    }).then(res => {

                        if (res.length == 0) {
                            Message.update({ TMESSAGES_Read_Status: "Delivered" }, {
                                where: {
                                    TMESSAGES_Read_Status: "Sent",
                                    TMESSAGES_Chat_Room_ID: data.chatRoomId,

                                },
                                raw: true
                            })
                                .then((res) => {
                                    callback(null, "Deliverd")
                                });
                        } else {
                            callback(null, "Sent")
                        }
                    })
                })
            }
        });

}
// create Room Message
function createRoomMessage(onlineMember, createMsgJson, data, callback) {
    let today = moment().utc().format("YYYY-MM-DD")
    if (data.isReply) {
        createMsgJson.TMESSAGES_IS_Reply = true,
            createMsgJson.TMESSAGES_Reply_File_Type = data.reply_file_type,
            createMsgJson.TMESSAGES_Reply_thumbnail = data.reply_thumbnail,
            createMsgJson.TMESSAGES_Reply_ID = data.messageId,
            createMsgJson.TMESSAGES_Reply_contand = data.messageContant
    }
    let message_Record = {

        TMESSAGES_Record_Chat_Room_ID: createMsgJson.TMESSAGES_Chat_Room_ID,
        TMESSAGES_Record_Read_Status: createMsgJson.TMESSAGES_Read_Status,
        TMESSAGES_Record_Content: createMsgJson.TMESSAGES_Content,
        TMESSAGES_Record_Created_date: today,
        TMESSAGES_Record_UID: createMsgJson.TMESSAGES_UID,
        TMESSAGES_Record_Read_Status: "Read"
    }
    createMsgJson.TMESSAGES_Created_date = today;

    Message.find({
        where: {
            [Op.and]: [
                { TMESSAGES_Created_date: today },
                { TMESSAGES_Today_First_message: true },
                { TMESSAGES_IS_Delete: false }
            ],
            TMESSAGES_Chat_Room_ID: data.chatRoomId,
        },
    }).then(msgdata => {

        if (!msgdata) {
            createMsgJson.TMESSAGES_Today_First_message = true;
            message_Record.TMESSAGES_Record_Today_First_message = true
        }
         Message.create(createMsgJson).then((msgRep) => {
            let createdUserMessage = JSON.parse(JSON.stringify(msgRep))
            Chatlog.update({
                TChat_Log_Initiated: false,
                TChat_Log_Is_User_Delete: false,
                TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                TChat_Log_Message_ID: createdUserMessage.TMESSAGES_Message_ID
            }, {
                    where: {
                        TChat_Log_Is_userLeft: false,
                        TChat_Log_Chat_Room_ID: data.chatRoomId,
                    }
                }).then(res => { })
             
            message_Record.TMESSAGES_Record_Message_ID = createdUserMessage.TMESSAGES_Message_ID,

                MessageRecord.create(message_Record).then(res => {
                    User.find({
                        where: {
                            id: createdUserMessage.TMESSAGES_UID
                        },
                        include: [
                            {
                                model: UserDetails, as: 'userDetails',
                            },
                        ]
                    }).then(userDetail => {
                        let senderDetails = JSON.parse(JSON.stringify(userDetail))
                        createdUserMessage.DC_LAST_NAME = senderDetails.userDetails.DC_LAST_NAME
                        createdUserMessage.DC_FIRST_NAME = senderDetails.userDetails.DC_FIRST_NAME
                        createdUserMessage.phone = senderDetails.DN_PHONE
                        createdUserMessage.DC_USER_IMAGE = senderDetails.DC_USER_IMAGE

                        // console.log("$#$$$$$$$$$ online users",msgResponse)

                        callback(null, createdUserMessage);

                    });

                })

            //update latest message to chat room
 
            if (data.isBroad == true) {
 
                Chatlog.update({
                    TChat_Log_Initiated: false,
                    TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    TChat_Log_Message_ID: msgRep.TMESSAGES_Message_ID
                }, {
                        where: {
                            TChat_Log_Is_userLeft: false,
                            TChat_Log_IS_Delete: false,
                            TChat_Log_Chat_Room_ID: data.chatRoomId,
                            TChat_Log_Sender: data.userId
                        }
                    }).then(res => { })
                Chatroom.findAll({
                    where: {
                        HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
                    },
                    include: [{ model: Userroom, as: 'chatRoomData' }],
                    raw: true
                }).then((chatRoomRes) => {
                    _.forEach(chatRoomRes, function (userRoom) {

                        if (userRoom['chatRoomData.DUSER_ROOM_UID'] != data.userId) {
                            let receiverId = userRoom['chatRoomData.DUSER_ROOM_UID']
                            let roomId = userRoom['chatRoomData.DUSER_ROOM_BroadCast_roomId']
                            createMsgJson['TMESSAGES_Chat_Room_ID'] = roomId
                            createMsgJson['TMESSAGES_Brodcast_Message_ID'] = msgRep.TMESSAGES_Message_ID

                            Chatlog.findAll(
                                {
                                    where: { "TChat_Log_Chat_Room_ID": roomId },
                                }).then(res => {
                                    if (res && res.length == 0) {

                                        Chatroom.findAll({
                                            where: {
                                                HCHAT_ROOM_Chat_Room_ID: roomId
                                            },
                                            include: [
                                                {
                                                    model: Userroom, as: 'chatRoomData'
                                                },
                                            ],
                                            raw: true
                                        })
                                            .then((chatRoomRes) => {

                                                let chatLogInput = {
                                                    "TChat_Log_Chat_Request_ID": 0,
                                                    "TChat_Log_Sender": data.userId,
                                                    "TChat_Log_Receiver": null,
                                                    "TChat_Log_Chat_Room_ID": roomId,
                                                    "TChat_Log_Status": "Message",
                                                    // TChat_Log_Message_ID:JSON.parse(JSON.stringify(msgRep)).TMESSAGES_Message_ID,
                                                    "TChat_Log_Updated_On": new Date().toISOString().slice(0, 19).replace('T', ' ')
                                                };
                                              
                                                chatLogInput.TChat_Log_Sender = chatRoomRes[1]['chatRoomData.DUSER_ROOM_UID']
                                                chatLogInput.TChat_Log_Receiver = chatRoomRes[0]['chatRoomData.DUSER_ROOM_UID']
                                                Chatlog.create(chatLogInput).then((chatLogResponse) => { });

                                                chatLogInput.TChat_Log_Sender = chatRoomRes[0]['chatRoomData.DUSER_ROOM_UID']
                                                chatLogInput.TChat_Log_Receiver = chatRoomRes[1]['chatRoomData.DUSER_ROOM_UID']
                                                Chatlog.create(chatLogInput).then(res => { });

                                                // });

                                            });
                                    }
                                })
                            //send broadcast message to individual room
                            if (data.hasFile) {
                                let docJson = {
                                    TDOCUMENTS_Document_Type: data.istype,
                                    TDOCUMENTS_Document_Name: data.filename,
                                    TDOCUMENTS_Document_Path: data.msg,
                                    TDOCUMENTS_Uid: data.userId,
                                    TDOCUMENTS_Chat_Room_ID: roomId,
                                    TDOCUMENTS_Thumbnail_Url: msgdata.TMESSAGES_Thumbnail_Url
                                }
                                data.chatRoomId = roomId
                                Document.create(docJson).then((docResp) => {
                                    createMsgJson['TMESSAGES_Document_ID'] = docResp.TDOCUMENTS_Document_ID;
                                    createMsgJson['TMESSAGES_Created_On'] = new Date().toISOString().slice(0, 19).replace('T', ' ')
                                    createMsgJson['TMESSAGES_Updated_On'] = new Date().toISOString().slice(0, 19).replace('T', ' ')
                                    createMsgJson['TMESSAGES_Chat_Room_ID'] = docJson.TDOCUMENTS_Chat_Room_ID
                                    createMsgJson['TMESSAGES_Brodcast_Message_ID'] = msgRep.TMESSAGES_Message_ID

                                    createBroadcastRoomMessage(receiverId, onlineMember, createMsgJson, data, roomId, callback);

                                });
                            }
                            else {
                                //   console.log(roomId,createMsgJson,"&&&&&&&&&&&&&",receiverId,data.hasFile)

                                createBroadcastRoomMessage(receiverId, onlineMember, createMsgJson, data, roomId, callback);
                            }

                        }
                    })


                });



            } else {
                Chatlog.update({
                    TChat_Log_Initiated: false,
                    TChat_Log_Is_User_Delete: false,
                    TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    TChat_Log_Message_ID: msgRep.TMESSAGES_Message_ID
                }, {
                        where: {
                            TChat_Log_Is_userLeft: false,
                            TChat_Log_Chat_Room_ID: data.chatRoomId,
                        }
                    }).then(res => { })
                createMessageRecordLogs(data, JSON.parse(JSON.stringify(msgRep)), false, callback)
                if (msgRep.TMESSAGES_File_Type == "text" || msgRep.TMESSAGES_File_Type == "Text") {
                    // nlpKeword(msgRep, data.userId)
                }
            }

        })
    })
}
//update today indecator message status
function updateTodayIndicatorMessage(roomId, userId) {
    let today = moment.utc().format('YYYY-MM-DD');

    MessageRecord.findAll({
        where: {
            TMESSAGES_Record_Created_date: today,
            TMESSAGES_Record_Chat_Room_ID: roomId,
            TMESSAGES_Record_IS_Delete: false,
            TMESSAGES_Record_UID: userId
        },
        raw: true
    }).then(message => {
        if (message.length != 0) {
            for (var i = 1; i < message.length; i++) {
                let todaysMessageList = message[i];

                if (todaysMessageList.TMESSAGES_Record_Today_First_message) {
                    MessageRecord.update({ TMESSAGES_Record_Today_First_message: false }, {
                        where: { TMESSAGES_Record_Message_ID: todaysMessageList.TMESSAGES_Record_Message_ID }
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
            TMESSAGES_IS_User_Join: false
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

//create message record Logs
function createMessageRecordLogs(inputData, createdMessage, isBroadCast, callback) {
    let today = moment().utc().format("YYYY-MM-DD")
    Chatlog.update({
        TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
        TChat_Log_Initiated: false,
        TChat_Log_IS_Archive: false,
        TChat_Log_Is_User_Delete: false
    }, {
            where: {
                [Op.or]: [{ TChat_Log_Is_User_Delete: true }, { TChat_Log_IS_Archive: true }],
                TChat_Log_Chat_Room_ID: inputData.chatRoomId,
            }
        }).then(res => { })
    let userMessage = {

        TMESSAGES_Record_Chat_Room_ID: createdMessage.TMESSAGES_Chat_Room_ID,
        TMESSAGES_Record_Read_Status: createdMessage.TMESSAGES_Read_Status,
        TMESSAGES_Record_Message_ID: createdMessage.TMESSAGES_Message_ID,
        TMESSAGES_Record_Content: createdMessage.TMESSAGES_Content,
        TMESSAGES_Record_Created_date: today
    }
    inputData.chatRoomId = userMessage.TMESSAGES_Record_Chat_Room_ID
     Chatroom.findAll({
        where: {
            HCHAT_ROOM_Chat_Room_ID: createdMessage.TMESSAGES_Chat_Room_ID
        },
        include: [{ model: Userroom, as: 'chatRoomData' }],
        raw: true
    }).then((chatRoomRes) => {
        return _.forEach(chatRoomRes, function (chatRoomRes) {

            let userId = chatRoomRes['chatRoomData.DUSER_ROOM_UID']
            if (userId != inputData.userId && !chatRoomRes['chatRoomData.DUSER_ROOM_IS_User_left']) {

                MessageRecord.findAll({
                    where: {
                        [Op.and]: [
                            { TMESSAGES_Record_Created_date: today },
                            { TMESSAGES_Record_Today_First_message: true },
                            { TMESSAGES_Record_IS_Delete: false },
                        ],
                        TMESSAGES_Record_Chat_Room_ID: createdMessage.TMESSAGES_Chat_Room_ID,
                        TMESSAGES_Record_UID: userId
                    }
                }).then(response => {
                    if (_.size(response) == 0) {
                        userMessage.TMESSAGES_Record_Today_First_message = true
                    } else {
                        userMessage.TMESSAGES_Record_Today_First_message = false
                    }
                    userMessage.TMESSAGES_Record_UID = userId
                    return MessageRecord.create(userMessage).then(res => {

                    })
                })
            }

            //sender user  initially in Read status

        });
    })


}

//Create user losgs
function createUserLogs(data, chatLogInput, callback) {

    let logIp = {
        "TChat_Log_Status": "Accept",
        "TChat_Log_Chat_Room_ID": data.chatRoomId,
    }
    Chatlog.findAll({
        where: logIp,
        raw: true
    }).then((resLog) => {
        if (resLog.length != 0) {
            Chatroom.findAll({
                where: {
                    HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
                },
                include: [
                    {
                        model: Userroom, as: 'chatRoomData'

                    },
                ],
                raw: true
            })
                .then((chatRoomRes) => {
 
                    Chatlog.update({

                        TChat_Log_IS_Delete: false,
                        where: {
                            TChat_Log_IS_Delete: true, TChat_Log_Chat_Room_ID: data.chatRoomId,
                            TChat_Log_Receiver: data.userId
                        }
                    }).then(res => { })


                    _.forEach(chatRoomRes, function (chatRoomRes) {
                        let chatLogInputForUsers = {
                            "TChat_Log_Status": "Message",
                            "TChat_Log_Chat_Request_ID": 0,
                            "TChat_Log_Chat_Room_ID": data.chatRoomId,
                            "TChat_Log_Sender": chatRoomRes['chatRoomData.DUSER_ROOM_UID']
                        };

                        Chatlog.create(chatLogInputForUsers).then((chatLogResponse) => {
                            const dataObj = chatLogResponse.get({ plain: true });


                        })

                    });
                });


        } else {
            if (data.multifiles) {
                if (data.i == data.totCount) {
                    // updatePreviousLogAndCreate(chatLogInput);
                }
            } else {
                // updatePreviousLogAndCreate(chatLogInput);
            }
        }
    })
}

// update previous logs and create 
function updatePreviousLogAndCreate(chatLogInput) {
    Chatlog.update({ TChat_Log_IS_Delete: true }, { //delete if last msg available
        where: chatLogInput
    }).then((updatedRes) => {
        Chatlog.create(chatLogInput).then((chatLogResponse) => {
            const dataObj = chatLogResponse.get({ plain: true });
        })
    });
}

//validation for ERP 
function validateERPToken(token, callback) {
    request.post({
        url: config.ERPToken.validateTokenURL,
        form: { "Token": token }
    },
        function (err, httpResponse, body) {
            if (err == null) {
                let resDat = JSON.parse(body);
                let resOne = resDat[0];
                if (resOne["StatusCode"] == 1 && resOne["Message"] == "Token Matched") { //success           
                    callback({ token: token });
                } else { //generate ERP token
                    request.post({
                        url: config.ERPToken.generateTokenURL,
                        form: {
                            "ClientID": config.ERPToken.ClientID,
                            "SecretKey": config.ERPToken.SecretKey,
                            "CompanyCode": config.ERPToken.CompanyCode
                        }
                    },
                        function (err2, httpResponse2, body2) {
                            if (err2 == null) {
                                let resTwo = JSON.parse(body2);
                                if (resTwo["StatusCode"] == 1 && resTwo["Message"] == "Generated Token is still valid") {
                                    callback({ token: token });
                                } else { //save it in table
                                    AppConfiguration.update({ TAppConfigurations_AppValue: resTwo["Message"] }, {
                                        where: { TAppConfigurations_AppKey: 'ERPToken' },
                                        raw: true
                                    }).then((tokenRes) => {
                                        callback({ token: resTwo["Message"] });
                                    });
                                }
                            } else {
                                callback({ token: null });
                            }
                        });
                }
            } else {
                callback({ token: null });
            }
        });
}
//NLP keywork
function nlpKeword(message, userId) {
    Userroom.findAll({
        where: {
            DUSER_ROOM_Chat_Room_ID: message.TMESSAGES_Chat_Room_ID
        }
    }).then(userroom => {
        let roomUsers = []
        _.forEach(userroom, function (room) {
            roomUsers.push(room.DUSER_ROOM_UID)
        })
        let data = {
            "loginuser": userId,
            "otherUsers": roomUsers,
            "message": message.TMESSAGES_Content
        }
        rp({
            url: config.DeelchatAPI + 'deelChat/nlpkeyword',
            'Content-type': 'application/json',

            method: 'POST',
            json: true,
            body: data
        })
            .then((response) => {
                // console.log("Error",req)
                console.log('success', response);
                if (response.status != null) {
                    if (response.status.status == 200) {
                        let nlpKey = response.entity.toString()
                        message.update({ TMESSAGES_IS_Deel_Keyword: nlpKey }, {
                            where: {
                                TMESSAGES_Message_ID: message.TMESSAGES_Message_ID
                            }
                        }).then(response => {
                        })
                    }
                }
            });
    })
}

//Sharepoint upload
function sharePointUpload(files, imgSrcString, data, callback) {
    validateERPToken(data.token, function (validERPToken) {
        if (validERPToken.token != null) {
            var form = {
                "Token": validERPToken.token,
                "UserId": Number(new Date()) + data.userId + data.extension,
                "ModuleName": config.sharePoint.ModuleName,
                "File": imgSrcString
            };
            if (data.istype == "image") {
                form["DocumentType"] = config.sharePoint.ImageDocumentType;
            } else {
                form["DocumentType"] = config.sharePoint.DocumentType;
            }
            // let credentialOptions = {
            //     username: 'jp_sharan',
            //     password: 'sha_moni_12345',
            //     domain: 'ecc-web',
            // };

            console.log("SHAREPOINT FORM!!!!")
            console.log("@@@@@@@@@@@@@@@@@@@@")
            console.log(form)

            httpntlm.post({
                url: config.sharePoint.uploadURL,
                username: config.sharePoint.username,
                password: config.sharePoint.password,
                domain: config.sharePoint.domain,
                parameters: form
            }, function (err, res) {
                console.log("SHAREPOINT RESPONSE!!!!")
                console.log(err)
                console.log(res)

                if (res.body == "401 UNAUTHORIZED") {
                    callback(err, body);
                } else {
                    if (res.statusCode == 200) {
                        let uploadRes = JSON.parse(res.body);

                        let imageUrl = uploadRes[0].SiteUrl + "/" + form["DocumentType"] +
                            "/" + form["UserId"];

                        callback(err, {
                            status: 200,
                            image: imageUrl,
                            token: validERPToken.token
                        });
                    } else {
                        callback(err, {
                            status: 400,
                            image: res.body,
                            token: validERPToken.token
                        });
                    }
                }
            });
        }
    });
}

//get ERP Token
function getERPToken(data, callback) {
    AppConfiguration.findAll({
        where: { TAppConfigurations_AppKey: 'ERPToken' },
        raw: true
    }).then((tokenRes) => {
        callback(tokenRes[0].TAppConfigurations_AppValue);
    });
}