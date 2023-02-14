const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

const Userroom = db.define('CON_D_User_Rooms', {
    DUSER_ROOM_User_Room_ID: {
        allowNull: false,
        autoIncrement: true,
        type: UUID,
        primaryKey: true
    },
    DUSER_ROOM_UID: {
        type: STRING,
        references: {
            model: "tbl_cu_chatusers",
            key: "DN_ID"
        }
    },
    DUSER_ROOM_Chat_Room_ID: {
        type: INTEGER,
        references: {
            model: "CON_H_Chat_Room",
            key: "HCHAT_ROOM_Chat_Room_ID"
        }
    },
    DUSER_ROOM_Role: STRING, //Admin/User
    DUSER_ROOMS_Created_On: {
        type: Date,
        defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    DUSER_ROOMS_Updated_On: {
        type: Date,
        defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },

    DUSER_ROOM_Active: {
        type: Boolean,
        defaultValue: false
    },
    DUSER_ROOM_Archive: {
        type: Boolean,
        defaultValue: false
    },
    DUSER_ROOM_IS_User_left: {
        type: Boolean,
        defaultValue: false
    },
    DUSER_ROOM_BroadCast_roomId:{
        allowNull: true,
        type: INTEGER,
        references: {
            model: "CON_H_Chat_Room",
            key: "HCHAT_ROOM_Chat_Room_ID"
        }
    }
    // DUSER_ROOM_Is_Broadcast:{
    //     type: Boolean,
    //     defaultValue: false   
    // }
}, {
        timestamps: false,
        underscore: true
    });


module.exports = Userroom;
