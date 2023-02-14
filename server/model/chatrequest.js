const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const bcrypt = require('bcryptjs');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

const Chatrequest = db.define('CON_T_Chat_Request', {
    TCHAT_REQUEST_Chat_Request_ID: {
        allowNull: false,
        autoIncrement: true,
        type: UUID,
        primaryKey: true
    },
    TCHAT_REQUEST_Sender: {
        type: INTEGER,
        // references: {
        //     model: "tbl_cu_chatusers",
        //     key: "DN_ID"
        // }
    },
    TCHAT_REQUEST_Receiver: {
        type: INTEGER,
        // references: {
        //     model: "tbl_cu_chatusers",
        //     key: "DN_ID"
        // }
    },
    
    TCHAT_REQUEST_Status: STRING, //Request/Accept/Reject
    TCHAT_REQUEST_Created_On: {
        type: Date,
        defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    TCHAT_REQUEST_Updated_On: {
        type: Date,
        defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    TCHAT_REQUEST_IS_Delete: {
        type: Boolean,
        defaultValue: false
    },

}, {
        timestamps: false,
        underscore: true
    });

module.exports = Chatrequest;
