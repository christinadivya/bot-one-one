const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

const Sync_contact = db.define('tbl_cu_sync_contacts', { //tbl_cu_chatusers => tbl_user

  DN_ID: { //DN_ID => DN_ID
    allowNull: false,
    autoIncrement: true,
    type: UUID,
    primaryKey: true
  },
  userId:STRING,
  appUser:{
  type: STRING,
    references: {
      model: "tbl_cu_chatusers",
      key: "DN_ID"
    }
  },
  name:STRING,
  appUserStatus:INTEGER,
  DB_DELETED:INTEGER,
  email:STRING,
  countryCode:STRING,
  deviceToken:STRING,
   chatRoomId:{
    type: INTEGER,
    references: {
      model: "CON_H_Chat_Room",
      key: "HCHAT_ROOM_Chat_Room_ID"
    }
  },
  phone:INTEGER
}, {
    timestamps: false,
    underscore: true
  });

module.exports = Sync_contact;
