const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
const config = require('../../config/configuration');
let moment = require("moment")


const Message = db.define('CON_T_Messages', {
  TMESSAGES_Message_ID: {
    allowNull: false,
    autoIncrement: true,
    type: UUID,
    primaryKey: true
  },
  TMESSAGES_Content: STRING,
  TMESSAGES_UID: {
    type: INTEGER,
    references: {
      model: "tbl_cu_chatusers",
      key: "DN_ID"
    }
  },
  TMESSAGES_Document_ID: {
    type: INTEGER,
    references: {
      model: "CON_T_Documents",
      key: "TDOCUMENTS_Document_ID"
    }
  },
  TMESSAGES_Chat_Room_ID: {
    type: INTEGER,
    references: {
      model: "CON_H_Chat_Room",
      key: "HCHAT_ROOM_Chat_Room_ID"
    }
  },
  TMESSAGES_Status: STRING,
  TMESSAGES_File_Type: {
    type: STRING,
    defaultValue: 'text'
  }, //image/PDF/video
  TMESSAGES_File_Name: STRING,
  TMESSAGES_Read_Status: {
    type: STRING,
    defaultValue: "Sent" //Sent/Delivered/Read
  },
  TMESSAGES_IS_Delete: {
    type: Boolean,
    defaultValue: false
  },
  TMESSAGES_Created_On: {
    type: Date,
    defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  TMESSAGES_Updated_On: {
    type: Date,
    defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  TMESSAGES_Thumbnail_Url: {
    type: STRING,
    defaultValue: config.authUrl + "/images/thumbnail.png"
  },
  TMESSAGES_Today_First_message: {
    type: Boolean,
    defaultValue: false
  },
  TMESSAGES_Created_date: {
    type: Date,
    // defaultValue:  new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  TMESSAGES_IS_User_Exit: {
    type: Boolean,
    defaultValue: false
  },

  TMESSAGES_IS_User_Join: {
    type: Boolean,
    defaultValue: false
  },
  TMESSAGES_IS_Dazz_id:STRING,
  TMESSAGES_IS_Nymn_string:STRING,

  TMESSAGES_Reply_contand: STRING,//reply for the particular mssage
  TMESSAGES_Reply_ID: INTEGER,//replay msg id
  //new column
  TMESSAGES_Contact_name:STRING,
  TMESSAGES_Contact_number:STRING,
  TMESSAGES_Lat:STRING,
  TMESSAGES_Long:STRING,
  TMESSAGES_IS_Reply:{
    type:Boolean,
    defaultValue:false
  },
  TMESSAGES_IS_Deel_Keyword:STRING,
  TMESSAGES_Reply_File_Type:STRING,

  TMESSAGES_IS_BroadCast: {
    type: Boolean,
    defaultValue: false
  },
}, {
    timestamps: false,
    underscore: true
  });




module.exports = Message;
