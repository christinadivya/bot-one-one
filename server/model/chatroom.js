const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

const Chatroom = db.define('CON_H_Chat_Room', {
  HCHAT_ROOM_Chat_Room_ID: {
    allowNull: false,
    autoIncrement: true,
    type: UUID,
    primaryKey: true
  },
  HCHAT_ROOM_Name: {
    type: STRING,
    unique: true,
  },
  HCHAT_ROOM_IS_Group: {
    type: INTEGER,
    defaultValue: false
  },
  HCHAT_ROOM_IS_Delete: {
    type: Boolean,
    defaultValue: false
  },
  HCHAT_ROOMS_Created_On: {
    type: Date,
    defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  HCHAT_ROOMS_Updated_On: {
    type: Date,
    defaultValue: new Date().toISOString().slice(0, 19).replace('T', ' ')
  },
  HCHAT_ROOMS_Message_ID: {
    type: INTEGER,
    references: {
      model: "CON_T_Messages",
      key: "TMESSAGES_Message_ID"
    }
  },

  HCHAT_ROOM_Description: STRING,
  HCHAT_ROOM_Is_Broadcast:{
    type: Boolean,
    defaultValue: false
  },
  HCHAT_ROOM_Chat_Room_image:STRING
}, {
    timestamps: false,
    underscore: true
  });


module.exports = Chatroom;
