const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
const config = require('../../config/configuration');

const Document = db.define('CON_T_Documents', {
  TDOCUMENTS_Document_ID: {
    allowNull: false,
    autoIncrement: true,
    type: UUID,
    primaryKey: true
  },
  TDOCUMENTS_Document_Type: STRING,
  TDOCUMENTS_Document_Name: STRING,
  TDOCUMENTS_Document_Path: STRING,
  TDOCUMENTS_Uid: {
    type: INTEGER,
    references: {
      model: "tbl_cu_chatusers",
      key: "TUser_UID"
    }
  },
  TDOCUMENTS_Chat_Room_ID: {
    type: INTEGER,
    references: {
      model: "CON_H_Chat_Room",
      key: "HCHAT_ROOM_Chat_Room_ID"
    }
  },
  TDOCUMENTS_IS_Delete: {
    type: Boolean,
    defaultValue: false
  },
  TDOCUMENTS_Created_On: {
    type: Date,
    defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  TDOCUMENTS_Updated_On: {
    type: Date,
    defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  TDOCUMENTS_Thumbnail_Url: {
    type: STRING,
    defaultValue: config.authUrl + "/images/thumbnail.png"
  },
}, {
    timestamps: false,
    underscore: true
  });

module.exports = Document;
