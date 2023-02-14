const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
const config = require('../../config/configuration');
let moment = require("moment")

const messageRecord = db.define('CON_T_Messages_Record', {
  TMESSAGES_Record_ID: {
    allowNull: false,
    autoIncrement: true,
    type: UUID,
    primaryKey: true
  },
  TMESSAGES_Record_Message_ID: {
    type: INTEGER,
    references: {
      model: "CON_T_Messages",
      key: "TMESSAGES_Message_ID"
    }
  },
  TMESSAGES_Record_UID: {
    type: STRING,
    references: {
      model: "tbl_cu_chatusers",
      key: "DN_ID"
    }
  },
 
  TMESSAGES_Record_Chat_Room_ID: {
    type: INTEGER,
    references: {
      model: "CON_H_Chat_Room",
      key: "HCHAT_ROOM_Chat_Room_ID"
    }
  },
  TMESSAGES_Record_Status: STRING,
 
  TMESSAGES_Record_Read_Status: {
    type: STRING,
    defaultValue: "Sent" //Sent/Delivered/Read
  },
  TMESSAGES_Record_IS_Delete: {
    type: Boolean,
    defaultValue: false
  },
  TMESSAGES_Record_Created_On: {
    type: Date,
    defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },

  TMESSAGES_Record_Updated_On: {
    type: Date,
    defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  TMESSAGES_Record_Content: STRING,
 
  TMESSAGES_Record_Today_First_message:{
    type: Boolean,
    defaultValue: false
  },
  TMESSAGES_Record_Created_date:{
    type: Date,
  }
}, {
    timestamps: false,
    underscore: true
  });

module.exports = messageRecord;
