// Database
const db = require('./_db');

// Models
const User = require('./user');
const Message = require('./message');
const Chatroom = require('./chatroom');
const Chatrequest = require('./chatrequest');
const Chatlog = require('./chatlog');
const Userroom = require('./userroom');
const Document = require('./document');
const MessageRecord = require('./messageRecord')
const Sync_contact=require('./Sync_contact')
const userDetail=require('./userDetails')
// const Notification = require('./notification');

// Associations
// user table maping
// User.hasOne(Sync_contact, { as: 'userDetails', foreignKey: 'appUser' });
// Sync_contact.belongsTo(User, { as: 'userDetails', foreignKey: 'appUser' });

// User.hasMany(Sync_contact, { as: 'user', foreignKey: 'appUser' });
// Sync_contact.belongsTo(User, { as: 'user', foreignKey: 'appUser' });

// User.hasOne(Sync_contact, { as: 'user', foreignKey: 'TCHAT_REQUEST_Sender' });
// Sync_contact.belongsTo(User, { as: 'user', foreignKey: 'TCHAT_REQUEST_Sender' });



userDetail.hasOne(User, { as: 'userDetails', foreignKey: 'id' });
User.belongsTo(userDetail, { as: 'userDetails', foreignKey: 'id' });
 

User.hasMany(Chatrequest, { as: 'sender', foreignKey: 'TCHAT_REQUEST_Sender' });
Chatrequest.belongsTo(User, { as: 'sender', foreignKey: 'TCHAT_REQUEST_Sender' });
User.hasMany(Chatrequest, { as: 'receiver', foreignKey: 'TCHAT_REQUEST_Receiver' });
Chatrequest.belongsTo(User, { as: 'receiver', foreignKey: 'TCHAT_REQUEST_Receiver' });

User.hasOne(Chatlog, { as: 'senderUser', foreignKey: 'TChat_Log_Sender' });
Chatlog.belongsTo(User, { as: 'senderUser', foreignKey: 'TChat_Log_Sender' });
User.hasOne(Chatlog, { as: 'receiverUser', foreignKey: 'TChat_Log_Receiver' });
Chatlog.belongsTo(User, { as: 'receiverUser', foreignKey: 'TChat_Log_Receiver' });

Chatrequest.hasMany(Chatlog, { as: 'chatRequestData', foreignKey: 'TChat_Log_Chat_Request_ID' });
Chatlog.belongsTo(Chatrequest, { as: 'chatRequestData', foreignKey: 'TChat_Log_Chat_Request_ID' });

Chatroom.hasMany(Chatlog, { as: 'chatRoomLogs', foreignKey: 'TChat_Log_Chat_Room_ID' });
Chatlog.belongsTo(Chatroom, { as: 'chatRoomLogs', foreignKey: 'TChat_Log_Chat_Room_ID' });

User.hasMany(Userroom, { as: 'userRoomData', foreignKey: 'DUSER_ROOM_UID' });
Userroom.belongsTo(User, { as: 'userRoomData', foreignKey: 'DUSER_ROOM_UID' });
Chatroom.hasMany(Userroom, { as: 'chatRoomData', foreignKey: 'DUSER_ROOM_Chat_Room_ID' });
Userroom.belongsTo(Chatroom, { as: 'chatRoomData', foreignKey: 'DUSER_ROOM_Chat_Room_ID' });

User.hasMany(Message, { as: 'userDetail', foreignKey: 'TMESSAGES_UID' });
Message.belongsTo(User, { as: 'userDetail', foreignKey: 'TMESSAGES_UID' });

Chatroom.hasMany(Message, { as: 'userRoomMessage', foreignKey: 'TMESSAGES_Chat_Room_ID' });
Message.belongsTo(Chatroom, { as: 'userRoomMessage', foreignKey: 'TMESSAGES_Chat_Room_ID' });

Chatroom.belongsTo(Message, { as: 'roomMessage', foreignKey: 'HCHAT_ROOMS_Message_ID' });
Message.hasOne(Chatroom, { as: 'roomMessage', foreignKey: 'HCHAT_ROOMS_Message_ID' });

Chatroom.hasMany(Document, { as: 'roomDocuments', foreignKey: 'TDOCUMENTS_Chat_Room_ID' });
Document.belongsTo(Chatroom, { as: 'roomDocuments', foreignKey: 'TDOCUMENTS_Chat_Room_ID' });

User.hasMany(Document, { as: 'userDocuments', foreignKey: 'TDOCUMENTS_Uid' });
Document.belongsTo(User, { as: 'userDocuments', foreignKey: 'TDOCUMENTS_Uid' });


Message.hasMany(MessageRecord, { as: 'roomMessages', foreignKey: 'TMESSAGES_Record_Message_ID' });
MessageRecord.belongsTo(Message, { as: 'roomMessages', foreignKey: 'TMESSAGES_Record_Message_ID' });

Message.hasOne(Chatlog, { as: 'LogMessage', foreignKey: 'TChat_Log_Message_ID' });
Chatlog.belongsTo(Message, { as: 'LogMessage', foreignKey: 'TChat_Log_Message_ID' });



// User.hasMany(Notification, { as:'notificationSender' , foreignKey: 'TNOTIFICATION_LOGS_Sender'});
// Notification.belongsTo(User, { as:'notificationSender' , foreignKey: 'TNOTIFICATION_LOGS_Sender'});
// User.hasMany(Notification, { as:'notificationReceiver' , foreignKey: 'TNOTIFICATION_LOGS_Receiver'});
// Notification.belongsTo(User, { as:'notificationReceiver' , foreignKey: 'TNOTIFICATION_LOGS_Receiver'});

module.exports = db;

