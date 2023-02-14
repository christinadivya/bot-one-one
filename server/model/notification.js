// const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
// const db = require('./_db');
// const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

// const Notification = db.define('CON_T_Notification_Logs', {
//   TNOTIFICATION_LOGS_Notification_Logs_ID: {
//     allowNull: false,
//     autoIncrement: true,
//     type: UUID,
//     primaryKey: true
//   },
//   TNOTIFICATION_LOGS_Notification_Type: STRING, //Message/Request
//   TNOTIFICATION_LOGS_Message: STRING,
//   TNOTIFICATION_LOGS_Sender: {
//     type: INTEGER,
//     references: {
//       model: "CON_T_Users",
//       key: "TUser_UID"
//     }
//   },
//   TNOTIFICATION_LOGS_Receiver: {
//     type: INTEGER,
//     references: {
//       model: "CON_T_Users",
//       key: "TUser_UID"
//     }
//   },
//   TNOTIFICATION_LOGS_Chat_Room_ID: {
//     type: INTEGER,
//     references: {
//       model: "CON_H_Chat_Room",
//       key: "HCHAT_ROOM_Chat_Room_ID"
//     }
//   },
//   TNOTIFICATION_LOGS_Status: {
//     type: STRING,
//     defaultValue: "Sent" //Sent/Delivered/Read
//   },
//   TNOTIFICATION_LOGS_Created_On: {
//       type: Date,
//       defaultValue:  new Date().toISOString().slice(0, 19).replace('T', ' ')
//   },
//   }, {
//   timestamps: false,
//   underscore: true
// });

// module.exports = Notification;
