const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const bcrypt = require('bcryptjs');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

const Chatlog = db.define('CON_T_Chat_Log', {
    TChat_Log_Chat_Log_ID: {
        allowNull: false,
        autoIncrement: true,
        type: UUID,
        primaryKey: true
    },
    TChat_Log_Chat_Request_ID: {
        allowNull: true,
        type: STRING,
        references: {
            model: "CON_T_Chat_Request",
            key: "TCHAT_REQUEST_Chat_Request_ID"
        }
    },
    TChat_Log_Message_ID: {
        allowNull: true,
        type: STRING,
        references: {
            model: "CON_T_Messages",
            key: "TMESSAGES_Message_ID"
        }
    },
    TChat_Log_Sender: {
        allowNull: true,
        type: STRING,
        references: {
            model: "tbl_cu_chatusers",
            key: "DN_ID"

        }
    },
    TChat_Log_IS_Archive: {
        type: Boolean,
        defaultValue: false
    },
    TChat_Log_Receiver: {
        type: INTEGER,
        references: {
            model: "tbl_cu_chatusers",
            key: "DN_ID"
        },
        allowNull: true,
    },
    TChat_Log_Status: {
        type: STRING,
        allowNull: false,
    },
    
    TChat_Log_Created_On: {
        type: Date,
        defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    TChat_Log_Updated_On: {
        type: Date,
        defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    TChat_Log_IS_Delete: {
        type: Boolean,
        defaultValue: false
    },
    TChat_Log_Is_User_Delete: {
        type: INTEGER,
        defaultValue: 0
    },

    TChat_Log_Chat_Room_ID: {
        allowNull: true,
        type: INTEGER,
        references: {
            model: "CON_H_Chat_Room",
            key: "HCHAT_ROOM_Chat_Room_ID"
        }
    },
    TChat_Log_IS_Accepted: {
        type: Boolean,
        defaultValue: false
    },

    TChat_Log_Is_userLeft: {
        type: Boolean,
        defaultValue: false
    },
    TChat_Log_Is_Broadcast:{
        type: Boolean,
        defaultValue: false
    },
    TChat_Log_Request_ID:{
        allowNull: true,
        type: INTEGER,
    },
    TChat_Log_Initiated:{
        type: Boolean,
        defaultValue: false
    }

}, {
        timestamps: false,
        underscore: true
    });

module.exports = Chatlog;
