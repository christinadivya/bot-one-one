const router = require('express').Router();
const passport = require('passport');
const moment = require('moment');
const Chatroom = require('../../model/chatroom');
const Userroom = require('../../model/userroom');
const Chatlog = require('../../model/chatlog');
const User = require('../../model/user');
const UserDetails = require('../../model/userDetails')
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const map = require('lodash/map');
const each = require('lodash/forEach');
const _ = require('underscore');
const Message = require('../../model/message');
const Document = require('../../model/document');
const Chatrequest = require('../../model/chatrequest');
const MessageRecord = require('../../model/messageRecord')

module.exports = {

    deleteGroup: function (data, callback) {
        let input = data;
    },

    //update Active
    updateActive: function (data, callback) {
        let findQuery;
        if ((data.roomId != "") && (data.roomId != null) && (data.roomId != undefined)) {
            findQuery = {
                DUSER_ROOM_UID: data.userId,
                DUSER_ROOM_Chat_Room_ID: data.roomId
            }
        }
        else {
            findQuery = {
                DUSER_ROOM_UID: data.userId,
                DUSER_ROOM_Active: true
            }
        }

        Userroom.findAll({
            where: findQuery,
            raw: true
        })
            .then((userRoom) => {
                if (userRoom.length != 0) {
                    Userroom.update({ DUSER_ROOM_Active: data.active }, {
                        where: findQuery
                    })
                        .then((updatedRes) => {
                            callback(null, "Successfully updated");
                        });
                } else {
                    callback(null, "Record Not found");
                }
            })
    },


    // exit group chat room: we have multiple admin in the group, 
    exitGroupChatRoom: function (data, callback) {
        console.log("****************** exit group chat room *********", data)
        let userRoomInput = {
            DUSER_ROOM_UID: data.user.userId,
            DUSER_ROOM_Chat_Room_ID: data.chatRoomId
        }
        // to check allready user left from group
        Userroom.findAll({
            where: userRoomInput,
            raw: true
        })
            .then((userRoomRes) => {
                console.log(userRoomInput,"@@@@@@@@@@@@@@@##",userRoomRes)
                if (userRoomRes.length != 0) {
                    let roomUser = userRoomRes[0];
                    if (roomUser.DUSER_ROOM_Role == "Admin") {
                        console.log(" make admin systematic @@@@@@@@@@@@@@@@@@@", userRoomInput)
                        makeAdminSystematic(data, userRoomInput, function (resp) {
                            createMessageForChatExit(data);
                            callback(null, resp);
                        });
                    } else {
                        createMessageForChatExit(data);
                        deleteUserRooms(userRoomInput, callback);
                    }
                    callback(userRoomRes)

                }
            });

    },
    fineMyName: function (data, callback) {
        User.find({
            where: { id: data.creatorId },
            raw: true,
            include: [
                { model: UserDetails, as: 'userDetails', attributes: ['DN_DETAIL_ID', 'DC_PROFILE_NAME'] },
            ],

        }).then((userRoomRes) => {

            callback(null, userRoomRes['userDetails.DC_PROFILE_NAME']);

        });
    },
    getUserNames: function (data, callback) {
        let userIds = []
        _.forEach(data.users, function (user) {
            userIds.push(user.userId)
        })
 
        User.findAll({
            where: { DN_ID: { $in: userIds } },
            raw: true,
            include: [
                { model: UserDetails, as: 'userDetails', attributes: ['DN_DETAIL_ID', 'DC_PROFILE_NAME'] },
            ],

        }).then((userRoomRes) => {
 
            let addUsersName = JSON.parse(JSON.stringify(userRoomRes))
            let userNames = []
            _.forEach(addUsersName, function (user) {
                userNames.push(user['userDetails.DC_PROFILE_NAME'])
            })
            callback(null,userNames);

        });
    },
    // find chat room 
    findChatRoom: function (data, callback) {
        Chatroom.findAll({
            where: {
                HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
            },
            raw: true
        })
            .then((foundRoom) => {
                callback(null, foundRoom);

            });
    },
    // create createbroadcast room 
    createbroadcast: function (data, callback) {
        //groupname,creatorId
        let groupInput = {
            HCHAT_ROOM_Name: data.groupname,
            HCHAT_ROOM_IS_Group: true
        }
        let groupUniqueName;
        let message = {}
        Chatroom.findAll({
            where: groupInput,
            raw: true
        }).then((foundRoom) => {
            if (foundRoom.length == 0) {
                groupUniqueName = data.groupname;
            } else {
                groupUniqueName = foundRoom[0].HCHAT_ROOM_Name + ' ';
            }
            return Chatroom.create({
                HCHAT_ROOM_Name: groupUniqueName,
                HCHAT_ROOM_IS_Group: true,
                HCHAT_ROOM_Is_Broadcast: true
            }).then((createdRoom) => {

                let createdRoomInJSON = createdRoom.toJSON();
                createbroadcastRoomAndusers(data, createdRoomInJSON)

                // console.log("@@@@@@@@@@@",createdRoomInJSON)

                // let resArr = [];
                // let chatRoomData = resArr.push(createdRoomInJSON);
                let today = moment().utc().format("YYYY-MM-DD");
                let createMsgJson = {
                    TMESSAGES_Content: "New Broadcast created ", //roomUserIds.join()+ " Joined the chat",
                    TMESSAGES_UID: data.creatorId,
                    TMESSAGES_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID,
                    TMESSAGES_Created_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    TMESSAGES_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    TMESSAGES_IS_User_Join: true,
                    TMESSAGES_Created_date: today,
                    // TMESSAGES_Mobile_dateTime:data.groupCreatedTime
                };
                // create message

                return Message.create(createMsgJson).then((msgRep) => {
                    // console.log(msgRep)
                    // console.log(msgRep.TMESSAGES_Message_ID)
                    // console.log("@###############88888888888888888888",msgRep.TMESSAGES_Chat_Room_ID)
                    message = JSON.parse(JSON.stringify(msgRep))
                    //create room

                    Chatroom.update({ HCHAT_ROOMS_Message_ID: msgRep.TMESSAGES_Message_ID }, {
                        where: { HCHAT_ROOM_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID }
                    }).then((updatedRes) => { });
                    //create log
                    let chatLogInputForUsers = {
                        "TChat_Log_Status": "Message",
                        "TChat_Log_Chat_Request_ID": 0,
                        "TChat_Log_Chat_Room_ID": createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID,
                        "TChat_Log_Sender": data.creatorId,
                        "TChat_Log_Is_Broadcast": true,
                        "TChat_Log_Updated_On": new Date().toISOString().slice(0, 19).replace('T', ' '),
                        "TChat_Log_Message_ID": msgRep.TMESSAGES_Message_ID
                    };
                    let userMessage = {

                        TMESSAGES_Record_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID,
                        // TMESSAGES_Record_Read_Status: createdMessage.TMESSAGES_Read_Status,
                        TMESSAGES_Record_Message_ID: msgRep.TMESSAGES_Message_ID,
                        TMESSAGES_Record_Content: msgRep.TMESSAGES_Content,
                        TMESSAGES_Record_UID: data.creatorId
                    }
                    MessageRecord.create(userMessage).then(res => {

                    })

                    return Chatlog.create(chatLogInputForUsers).then((chatLogResponse) => {
                        const dataObj = chatLogResponse.get({ plain: true });
                        // return createdRoom
                        //  callback(null, createdRoomInJSON);
                        callback(null, createdRoomInJSON)

                    });
                })

            })
            // .then(completeRoomCreation => {
            // //    callback(null, completeRoomCreation);
            // });
        })

    },
    createUserRoom: function (data, callback) {
        addUserToUserRoom(data, callback);
    },
    //create group chat room
    createGroupChatRoom: function (data, callback) {
        let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let groupInput = {
            HCHAT_ROOM_Name: data.groupname,
            HCHAT_ROOM_IS_Group: true
        }
        let groupUniqueName;
        let message = {}
        Chatroom.findAll({
            where: groupInput,
            raw: true
        })
            .then((foundRoom) => {
                console.log("############################# found room chatroom 277", foundRoom[0])
                if (foundRoom.length == 0) {
                    groupUniqueName = data.groupname;
                } else {
                    groupUniqueName = foundRoom[0].HCHAT_ROOM_Name + ' ';
                }


                return Chatroom.create({
                    HCHAT_ROOM_Name: groupUniqueName,
                    HCHAT_ROOM_IS_Group: true,
                }).then((createdRoom) => {
                    console.log(createdRoom.HCHAT_ROOM_Chat_Room_ID, "##############555555s################ ")
                    let createdRoomInJSON = JSON.parse(JSON.stringify(createdRoom));
                    let resArr = [];
                    let chatRoomData = resArr.push(createdRoomInJSON);
                    let today = moment().utc().format("YYYY-MM-DD");
                    console.log(createdRoomInJSON, "############################## ")

                    let createMsgJson = {
                        TMESSAGES_Content: " ", //roomUserIds.join()+ " Joined the chat",
                        TMESSAGES_UID: data.creatorId,
                        TMESSAGES_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID,
                        TMESSAGES_Created_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        TMESSAGES_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        TMESSAGES_IS_User_Join: true,
                        TMESSAGES_Created_date: today,
                        // TMESSAGES_Mobile_dateTime:data.groupCreatedTime
                    };

                    return Message.create(createMsgJson).then((msgRep) => {
                        message = JSON.parse(JSON.stringify(msgRep))
                        console.log("_________________________ msgRep")
                        createdRoomInJSON.message = JSON.parse(JSON.stringify(msgRep))
                        console.log(message, "############# 3333 ##############")

                        Chatroom.update({ HCHAT_ROOMS_Message_ID: JSON.parse(JSON.stringify(msgRep)).TMESSAGES_Message_ID }, {
                            where: { HCHAT_ROOM_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID }
                        }).then((updatedRes) => { });

                        Chatlog.update({ TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '), TChat_Log_Message_ID: JSON.parse(JSON.stringify(msgRep)).TMESSAGES_Message_ID }, {
                            where: { TChat_Log_Is_userLeft: false, TChat_Log_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID }
                        }).then(res => { })
                        createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID = createMsgJson.TMESSAGES_Chat_Room_ID
                        return createdRoomInJSON;

                    })


                });
            })
            .then((completeRoomCreation) => {
                console.log("4444444444444444")
                // completeRoomCreation.messageId = message.TMESSAGES_Message_ID
                callback(null, completeRoomCreation);
            });

    },

    //create chat room
    createChatRoom: function (data, callback) {
        console.log(data)
        let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        Chatroom.findAll({
            where: {
                [Op.or]: [{ HCHAT_ROOM_Name: data.room1 }, { HCHAT_ROOM_Name: data.room2 }]
            },
            raw: true
        })
            .then((foundRoom) => {
                if (foundRoom.length == 0) {
                    return Chatroom.create({ HCHAT_ROOM_Name: data.room })
                        .then((createdRoom) => {
                            let createdRoomInJSON = createdRoom.toJSON();
                            let resArr = [];
                            let chatRoomData = resArr.push(createdRoomInJSON);
                            return resArr;

                        });
                } else {
                    return foundRoom;
                }
            }).then((completeRoomCreation) => {
                callback(null, completeRoomCreation);
            });
    },
    //check user already chat or not
    addUserToUserRoom: function (data, callback) {

        _.forEach(data.roomUsers, function (userId) {
            let inputJson = {
                DUSER_ROOM_UID: userId,
                DUSER_ROOM_Chat_Room_ID: data.chatRoomId,
                DUSER_ROOM_Role: "User"
            };
            Userroom.findAll({
                where: inputJson,
                raw: true
            })
                .then((foundUserRoom) => {

                    if (foundUserRoom.length == 0) {
                        return Userroom.create(inputJson)
                            .then((joinedUserRoom) => {
                                let joinedUserRoomInJSON = joinedUserRoom.toJSON();
                                let resArr = [];
                                return resArr.push(joinedUserRoomInJSON);
                            });
                    } else {
                        return foundUserRoom;
                    }
                })
                .then((joinedUserRes) => {
                    callback(null, joinedUserRes);
                });
        });
    },
    // new user join to the chatRoom 
    //join user to chat room
    addMembers: function (data, callback) {

        // console.log(data.data, "DSSSSSSSSSSSSSSSSSSSSSSSSSSSSS")
        let username = _.map(data.data.users, 'username');
        // console.log(data.username, "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS")
        // console.log(username.join())
        let today = moment().utc().format("YYYY-MM-DD");

        let createMsgJson = {
            TMESSAGES_Content:data.data.creator_name+" added " + data.data.username.join(),
            TMESSAGES_UID: data.data.creatorId,
            TMESSAGES_Chat_Room_ID: data.data.chatRoomId,
            TMESSAGES_Created_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
            TMESSAGES_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
            TMESSAGES_IS_User_Join: true,
            TMESSAGES_Created_date: today,
            // TMESSAGES_Mobile_dateTime:data.data.joingroupTime

        };

        let message
        // console.log("########", createMsgJson)
        Message.create(createMsgJson).then((msgRep) => {
            // console.log("message created ", msgRep.TMESSAGES_Message_ID )
            // console.log("00000000000000000000000000",JSON.parse(JSON.stringify(msgRep)))
            message = msgRep
            Chatroom.update({ HCHAT_ROOMS_Message_ID: message.TMESSAGES_Message_ID }, {
                where: { HCHAT_ROOM_Chat_Room_ID: data.data.chatRoomId }
            }).then((updatedRes) => { });
            Chatlog.update({ TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
             TChat_Log_Message_ID: message.TMESSAGES_Message_ID }, {
                where: { TChat_Log_Is_userLeft: false, TChat_Log_Chat_Room_ID: data.data.chatRoomId }
            }).then(res => { })

            let roomId = data.data.chatRoomId;
            _.forEach(data.data.users, function (user) {
                // console.log(user.userId, "@!!!!!!!!!!!!!!!!!!!!! userId 419", message)
                let userMessage = {
                    TMESSAGES_Record_Chat_Room_ID: roomId,
                    TMESSAGES_Record_Read_Status: "Sent",
                    TMESSAGES_Record_Message_ID: message.TMESSAGES_Message_ID,
                    TMESSAGES_Record_Content: createMsgJson.TMESSAGES_Content,
                    TMESSAGES_Record_UID: user.userId
                }
                MessageRecord.create(userMessage).then(res => { })
                let inputJson = {
                    DUSER_ROOM_UID: user.userId,
                    DUSER_ROOM_Chat_Room_ID: roomId,
                };


                Userroom.findAll({
                    where: inputJson,
                    raw: true
                })
                    .then((foundUserRoom) => {
                        // console.log(foundUserRoom, "%%%%%%%%%%%%%%%%%%%%% found user room 438")
                        if (foundUserRoom.length == 0) {
                            inputJson['DUSER_ROOM_Role'] = 'User'
                            return Userroom.create(inputJson)
                                .then((joinedUserRoom) => {
                                    //  console.log("############### joinedUserRoom",joinedUserRoom)
                                    createlogforAddusers(data, inputJson, message);
                                });
                        } else {
                            // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@123123123",inputJson)
                            Userroom.update({ DUSER_ROOM_IS_User_left: false }, {
                                where: inputJson
                            }).then((updatedRes) => { });
                            createlogforAddusers(data, inputJson, message);

                        }
                    })
                    .then((joinedUserRes) => {
                        callback(null, joinedUserRes);
                    });
            });
        })
    },

    //join user to chat room
    joinUserToChatRoom: function (data, callback) {
        if (data.data.isGroup && data.data.addUsers) {

            if (data.data.users) {

                let roomUserIds = _.map(data.data.users, 'username');
                // console.log(roomUserIds)
                let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
                let today = moment().utc().format("YYYY-MM-DD");
                //update last update time in log who are in the group
                Chatlog.update({
                    TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    TChat_Log_Is_userLeft: false,
                    TChat_Log_IS_Delete: false
                },
                    {
                        where: {
                            TChat_Log_Sender: data.data.users[0].userId,
                            TChat_Log_Chat_Room_ID: data.data.chatRoomId
                        }
                    })
                    .then(resp => {
                    }).then((updatedRes) => { });
                // Message.update({ TMESSAGES_IS_User_Exit: 0 }, {
                //     where: { TMESSAGES_UID: data.data.users[0].userId, TMESSAGES_Chat_Room_ID: data.data.chatRoomId }
                // })
                // .then((updatedRes) => { });
                let msg
                if (data.data.createGroup) {
                    msg = "New group initiated"
                } else {
                    msg = roomUserIds.join() + " Joined the chat"
                }
                let createMsgJson = {
                    TMESSAGES_Content: msg,
                    TMESSAGES_UID: data.data.creatorId,
                    TMESSAGES_Chat_Room_ID: data.data.chatRoomId,
                    TMESSAGES_Created_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    TMESSAGES_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    TMESSAGES_IS_User_Join: true,
                    TMESSAGES_Created_date: today,
                    // TMESSAGES_Mobile_dateTime:data.data.joingroupTime

                };

                let createdMessage
                Message.create(createMsgJson).then((msgRep) => {
                    createdMessage = JSON.parse(JSON.stringify(msgRep))
                    console.log(createdMessage, "$$$$44444444444444444444444444")

                    Chatroom.update({ HCHAT_ROOMS_Message_ID: msgRep.TMESSAGES_Message_ID }, {
                        where: { HCHAT_ROOM_Chat_Room_ID: data.data.chatRoomId }
                    }).then((updatedRes) => { });
                    Chatlog.update({ TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '), TChat_Log_Message_ID: msgRep.TMESSAGES_Message_ID }, {
                        where: { TChat_Log_Is_userLeft: false, TChat_Log_Chat_Room_ID: data.data.chatRoomId }
                    }).then(res => { })


                    data.data.messageId = createdMessage.TMESSAGES_Message_ID

                    let userMessage = {
                        TMESSAGES_Record_Chat_Room_ID: createdMessage.TMESSAGES_Chat_Room_ID,
                        TMESSAGES_Record_Read_Status: createdMessage.TMESSAGES_Read_Status,
                        TMESSAGES_Record_Message_ID: createdMessage.TMESSAGES_Message_ID,
                        TMESSAGES_Record_Content: createdMessage.TMESSAGES_Content,
                        TMESSAGES_Record_UID: createdMessage.TMESSAGES_UID
                    }
                    MessageRecord.create(userMessage).then(res => { })
                })
            }
        }
        let roomId = data.data.chatRoomId;
        console.log(data.data.users, "^^^^^^^^^^^^^^^^^ data.data.users")
        _.forEach(data.data.users, function (user) {
            console.log("+++++++++++++++++++++++++++", user)
            let userId = user.userId
            let inputJson = {
                DUSER_ROOM_UID: user.userId,
                DUSER_ROOM_Chat_Room_ID: roomId,
            };

            if (data.data.isGroup && data.data.creatorId == user.userId) {
                inputJson['DUSER_ROOM_Role'] = 'Admin';
            } else {
                inputJson['DUSER_ROOM_Role'] = 'User';
            }
            Userroom.findAll({
                where: inputJson,
                raw: true
            })
                .then((foundUserRoom) => {
                    console.log(foundUserRoom, "found user room 5 555555555555555555 539 chat room")
                    if (foundUserRoom.length == 0) {
                        return Userroom.create(inputJson)
                            .then((joinedUserRoom) => {
                                let joinedUserRoomInJSON = joinedUserRoom.toJSON();
                                let resArr = [];
                                if (data.data.isGroup) { // && data.data.createLogs
                                    createUserLogs(data, inputJson);
                                }
                                return resArr.push(joinedUserRoomInJSON);
                            });
                    } else {
                        return foundUserRoom;
                    }
                })
                .then((joinedUserRes) => {
                    callback(null, joinedUserRes);
                });
        });
    }
}
function addUserToUserRoom(data, callback) {
    console.log(data);
    data.data.chatRoomId=data.chatRoomId

    createLog(data.data)

    _.forEach(data.roomUsers, function (userId) {
        let inputJson = {
            DUSER_ROOM_UID: userId,
            DUSER_ROOM_Chat_Room_ID: data.chatRoomId,
            DUSER_ROOM_Role: "User"
        };
        Userroom.findAll({
            where: inputJson,
            raw: true
        })
            .then((foundUserRoom) => {

                if (foundUserRoom.length == 0) {
                    return Userroom.create(inputJson)
                        .then((joinedUserRoom) => {
                            let joinedUserRoomInJSON = joinedUserRoom.toJSON();
                            let resArr = [];
                            //create chatlog
                            return resArr.push(joinedUserRoomInJSON);
                        });
                } else {
                    return foundUserRoom;
                }
            })
            .then((joinedUserRes) => {
                callback(null, joinedUserRes);
            });
    });
}

// create message for user  left : added message id to chatroom table to view last message
function createMessageForChatExit(data) {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@create message for chat exit", data)
    let today = moment().utc().format("YYYY-MM-DD")




    let username = "User"

    User.find({
        where: { id: data.user.userId },
        raw: true,
        include: [
            { model: UserDetails, as: 'userDetails', attributes: ['DN_DETAIL_ID', 'DC_PROFILE_NAME'] },
        ],

    }).then((userRoomRes) => {
        username = userRoomRes['userDetails.DC_PROFILE_NAME']
        //   console.log("111111111111111111111111111111111111111111111111111",username)
        let msg
        if (data.leftType == "remove") {
            msg = data.username + " removed " + username
        } else if (data.leftType == "left") {
            msg = username + " Left the Group "
        }

        let createMsgJson = {
            TMESSAGES_Content: msg,
            TMESSAGES_UID: data.user.userId,
            TMESSAGES_Chat_Room_ID: data.chatRoomId,
            TMESSAGES_Created_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
            TMESSAGES_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
            TMESSAGES_IS_User_Exit: true,
            TMESSAGES_Created_date: today,
            // TMESSAGES_Mobile_dateTime:data.TMESSAGES_Mobile_dateTime
        };

        Message.create(createMsgJson).then((msgRep) => {

            Chatroom.update(
                { HCHAT_ROOMS_Message_ID: msgRep.TMESSAGES_Message_ID, HCHAT_ROOMS_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' ') }, {
                    where: { HCHAT_ROOM_Chat_Room_ID: data.chatRoomId }
                })
                .then((updatedRes) => { });
            console.log("************** exit messge created *************", JSON.parse(JSON.stringify(msgRep)))
            createMessageRecordLogs(data, JSON.parse(JSON.stringify(msgRep)))

            Chatlog.update({
                TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                TChat_Log_Message_ID: msgRep.TMESSAGES_Message_ID
            }, {
                    where: {
                        // update all users in logs
                        TChat_Log_Chat_Room_ID: data.chatRoomId,
                        TChat_Log_Is_userLeft: false
                    }
                }).then(res => {
                    Chatlog.update({
                        TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        TChat_Log_Is_userLeft: true
                    }, {
                            where: {
                                TChat_Log_Sender: data.user.userId,
                                TChat_Log_Chat_Room_ID: data.chatRoomId,
                            }
                        }).then(res => { })
                })

        })
    })
}

//crete mesager record for each user 
function createMessageRecordLogs(data, createdMessage) {
    console.log("message create for record #$$$$$$$$$$$$$13123", data, createdMessage)
    let userMessage = {

        TMESSAGES_Record_Chat_Room_ID: createdMessage.TMESSAGES_Chat_Room_ID,
        TMESSAGES_Record_Read_Status: createdMessage.TMESSAGES_Read_Status,
        TMESSAGES_Record_Message_ID: createdMessage.TMESSAGES_Message_ID,
        TMESSAGES_Record_Content: createdMessage.TMESSAGES_Content,
    }

    Chatroom.findAll({
        where: {
            HCHAT_ROOM_Chat_Room_ID: data.chatRoomId
        },
        include: [{ model: Userroom, as: 'chatRoomData' }],
        raw: true
    })
        .then((chatRoomRes) => {
            _.forEach(chatRoomRes, function (chatRoomRes) {

                let userId = chatRoomRes['chatRoomData.DUSER_ROOM_UID']
                //sender user  initially in Read status
                userMessage.TMESSAGES_Record_UID = userId
                MessageRecord.create(userMessage).then(res => { })
            });
        });


}

//make Admin sytematic delete (destroy) left user form table 
function makeAdminSystematic(data, userRoomInput, callback) {
    Userroom.update({ DUSER_ROOM_IS_User_left: true }, {
        where: userRoomInput
    }).then((updatedRes) => {

        Userroom.findAll({
            where: {
                DUSER_ROOM_Chat_Room_ID: data.chatRoomId,
                DUSER_ROOM_Role: 'Admin',
                DUSER_ROOM_IS_User_left: false
            },
            raw: true
        }).then((userRoomRes) => {
            console.log("*************** user romm res  for admin ", userRoomRes)
            if (userRoomRes.length == 0) {

                Userroom.findAll({
                    where: {
                        DUSER_ROOM_Chat_Room_ID: data.chatRoomId,
                        DUSER_ROOM_IS_User_left: false
                    },
                    raw: true
                }).then((userRoomRes) => {
                    let nextAdmin = userRoomRes[0];

                    let nextAdminInput = {
                        DUSER_ROOM_UID: nextAdmin.DUSER_ROOM_UID,
                        DUSER_ROOM_Chat_Room_ID: nextAdmin.DUSER_ROOM_Chat_Room_ID
                    }
                    console.log("((((((((((((((((((((((((", nextAdminInput)
                    Userroom.update({ DUSER_ROOM_Role: 'Admin' }, {
                        where: nextAdminInput
                    })
                        .then((updatedRes) => {
                            callback(updatedRes);
                        });
                })

            } else {
                callback(data);
            }
        });
    });
}

//delte user room (destroy)
function deleteUserRooms(userRoomInput, callback) {
    Userroom.update({ DUSER_ROOM_IS_User_left: true }, {
        where: userRoomInput
    }).then((updatedRes) => {

        callback(null, updatedRes);
    });


}

//add members logs with message id
function createlogforAddusers(data, inputJson, message) {
    // console.log(inputJson, message, "+========== 6666666666 ===============")
    let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let chatLogInputForUsers = {
        "TChat_Log_Status": "Message",
        "TChat_Log_Chat_Request_ID": 0,
        "TChat_Log_Chat_Room_ID": inputJson.DUSER_ROOM_Chat_Room_ID,
        "TChat_Log_Sender": inputJson.DUSER_ROOM_UID,
    };

    Chatlog.findAll({
        where: chatLogInputForUsers,
        raw: true
    }).then((chatlogsRes) => {

        if (chatlogsRes.length == 0) {
            chatLogInputForUsers.TChat_Log_Updated_On = new Date().toISOString().slice(0, 19).replace('T', ' ')
            chatLogInputForUsers.TChat_Log_Message_ID = message.TMESSAGES_Message_ID
            Chatlog.create(chatLogInputForUsers).then((chatLogResponse) => {
                const dataObj = chatLogResponse.get({ plain: true });
            });
        } else {
            console.log("*************")
            Chatlog.update({
                TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                TChat_Log_Is_User_Delete: false,
                TChat_Log_Is_userLeft: false,
                TChat_Log_Message_ID: message.TMESSAGES_Message_ID,
            },{where: {
                    TChat_Log_Chat_Room_ID: inputJson.DUSER_ROOM_Chat_Room_ID,
                    TChat_Log_Sender: inputJson.DUSER_ROOM_UID
                }}
            ).then(res => { })


        }
    });
}
// function createlogforAddusers(data, inputJson, message) {
//     // console.log(inputJson, message, "+========== 6666666666 ===============")
//     let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
//     let chatLogInputForUsers = {
//         "TChat_Log_Status": "Message",
//         "TChat_Log_Chat_Request_ID": 0,
//         "TChat_Log_Chat_Room_ID": inputJson.DUSER_ROOM_Chat_Room_ID,
//         "TChat_Log_Sender": inputJson.DUSER_ROOM_UID,
//     };

//     Chatlog.findAll({
//         where: chatLogInputForUsers,
//         raw: true
//     }).then((chatlogsRes) => {

//         if (chatlogsRes.length == 0) {
//             chatLogInputForUsers.TChat_Log_Updated_On = new Date().toISOString().slice(0, 19).replace('T', ' ')
//             chatLogInputForUsers.TChat_Log_Message_ID = message.TMESSAGES_Message_ID
//             Chatlog.create(chatLogInputForUsers).then((chatLogResponse) => {
//                 const dataObj = chatLogResponse.get({ plain: true });
//             });
//         } else {
//             console.log("*************")
//             Chatlog.update({
//                 TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
//                 TChat_Log_Is_User_Delete: false,
//                 TChat_Log_Is_userLeft: false,
//                 TChat_Log_Message_ID: message.TMESSAGES_Message_ID,
//             },{where: {
//                     TChat_Log_Chat_Room_ID: inputJson.DUSER_ROOM_Chat_Room_ID,
//                     TChat_Log_Sender: inputJson.DUSER_ROOM_UID
//                 }}
//             ).then(res => { })


//         }
//     });
// }
// create log for individula chat
function createLog(data, inputJson) {
    // console.log(inputJson, message, "+========== 6666666666 ===============")
    console.log("^^^^^")
    console.log(data)
    
    let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let chatLogInputForUsers = {
        "TChat_Log_Status": "Message",
        "TChat_Log_Chat_Request_ID": 0,
        "TChat_Log_Request_ID":data.requestId,
        "TChat_Log_Chat_Room_ID": data.chatRoomId,
        "TChat_Log_Sender": data.senderId,
        "TChat_Log_Receiver": data.receiverId
  
    };
    console.log("@@@@@@@@@@@@@@@@@@",chatLogInputForUsers)

    Chatlog.findAll({
        where: chatLogInputForUsers,
        raw: true
    }).then((chatlogsRes) => {

        if (chatlogsRes.length == 0) {
            chatLogInputForUsers.TChat_Log_Updated_On = new Date().toISOString().slice(0, 19).replace('T', ' ')
             Chatlog.create(chatLogInputForUsers).then((chatLogResponse) => {
                console.log("GGGG")
                const dataObj = chatLogResponse.get({ plain: true });
            });
            chatLogInputForUsers.TChat_Log_Sender=data.receiverId
            chatLogInputForUsers.TChat_Log_Receiver=data.senderId
            console.log("!!!!!!!!!!!!",chatLogInputForUsers)

            Chatlog.create(chatLogInputForUsers).then((chatLogResponse) => {
                 const dataObj = chatLogResponse.get({ plain: true });
            });
        } 
        // else {
        //      Chatlog.update({
        //         TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
        //         TChat_Log_Is_User_Delete: false,
        //       },{where: {
        //             TChat_Log_Chat_Room_ID: inputJson.DUSER_ROOM_Chat_Room_ID,
        //             TChat_Log_Sender: inputJson.DUSER_ROOM_UID
        //         }}
        //     ).then(res => { })


        // }
    });
}

function createbroadcastRoomAndusers(data, createdRoomInJSON) {
    _.forEach(data.users, function (user) {
        if (data.creatorId != user.userId) {
            let room1 = data.creatorId + "&" + user.userId
            let room2 = user.userId + "&" + data.creatorId;
            Chatroom.findAll({
                where: {
                    [Op.or]: [{ HCHAT_ROOM_Name: room1 }, { HCHAT_ROOM_Name: room2 }]
                },
                raw: true
            }).then((foundRoom) => {
                console.log("#####$# 33333333333", foundRoom)
                if (foundRoom.length == 0) {
                    return Chatroom.create({ HCHAT_ROOM_Name: room1 })
                        .then((createdRoom) => {
                            let createdRooms = createdRoom.toJSON();
                            let roomUsersArr = []
                            roomUsersArr.push(data.creatorId)
                            roomUsersArr.push(user.userId)

                            addUserToUserRoom({ data: data, roomUsers: roomUsersArr, chatRoomId: createdRooms.HCHAT_ROOM_Chat_Room_ID }, function (err, joinedRoomResp) { });

                            let inputJson = {
                                DUSER_ROOM_UID: user.userId,
                                DUSER_ROOM_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID,
                                DUSER_ROOM_Role: "User",
                                DUSER_ROOM_BroadCast_roomId: createdRooms.HCHAT_ROOM_Chat_Room_ID
                            };
                            console.log(inputJson, "$$$$$$$$$$$$ new user to going to speake ", createdRooms)
                            return Userroom.create(inputJson).then((joinedUserRoom) => {

                            })
                        });
                } else {
                    console.log("$$$$$$$$$$$$ already user to going to speake ")

                    // console.log(foundRoom)

                    let inputJson = {
                        DUSER_ROOM_UID: user.userId,
                        DUSER_ROOM_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID,
                        DUSER_ROOM_BroadCast_roomId: foundRoom[0].HCHAT_ROOM_Chat_Room_ID,
                        DUSER_ROOM_Role: "User"
                    };

                    Userroom.create(inputJson).then((joinedUserRoom) => {

                    })

                }
            }).then((completeRoomCreation) => { });

        } else {
            let inputJson = {
                DUSER_ROOM_UID: user.userId,
                DUSER_ROOM_Chat_Room_ID: createdRoomInJSON.HCHAT_ROOM_Chat_Room_ID,
                DUSER_ROOM_Role: "Admin",
                // DUSER_ROOM_BroadCast_roomId: createdRooms.HCHAT_ROOM_Chat_Room_ID
            }
            Userroom.create(inputJson).then((joinedUserRoom) => { })


        }
    });

}

//Create user losgs

function createUserLogs(data, inputJson, message) {
    if (!data.data.messageId) {
        data.data.messageId = null
    }
    console.log(inputJson, message, "+=========================")
    let timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let chatLogInputForUsers = {
        "TChat_Log_Status": "Message",
        "TChat_Log_Chat_Request_ID": 0,
        "TChat_Log_Chat_Room_ID": inputJson.DUSER_ROOM_Chat_Room_ID,
        "TChat_Log_Sender": inputJson.DUSER_ROOM_UID,
    };

    Chatlog.findAll({
        where: chatLogInputForUsers,
        raw: true
    }).then((chatlogsRes) => {

        if (chatlogsRes.length == 0) {
            chatLogInputForUsers.TChat_Log_Updated_On = new Date().toISOString().slice(0, 19).replace('T', ' ')
            chatLogInputForUsers.TChat_Log_Message_ID = data.data.messageId
            Chatlog.create(chatLogInputForUsers).then((chatLogResponse) => {
                const dataObj = chatLogResponse.get({ plain: true });
            });
        } else {
            Chatlog.update({
                TChat_Log_Updated_On: new Date().toISOString().slice(0, 19).replace('T', ' '),
                TChat_Log_Is_User_Delete: false,
                TChat_Log_Is_userLeft: false,
                TChat_Log_Message_ID: data.data.messageId,
             },{ where: {
                    TChat_Log_Chat_Room_ID: inputJson.DUSER_ROOM_Chat_Room_ID,
                    TChat_Log_Sender: inputJson.DUSER_ROOM_UID
                }
            }).then(res => { })


        }
    });
}
