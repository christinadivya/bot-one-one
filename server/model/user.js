const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN,FLOAT, DOUBLE, UUID } = require('sequelize');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

const User = db.define('users', { //tbl_cu_chatusers => tbl_user

  id: { //DN_ID => DN_ID
    allowNull: false,
    autoIncrement: true,
    type: UUID,
    primaryKey: true
  },
  username: { 
    type: STRING,
    validate: {
      notEmpty: true,
    },
    unique: true,
  },
  email: STRING, 
  mobile: STRING,
  address: STRING,
  password: STRING,
  govt_id: STRING,
  govt_id_exp_date: DATE ,
  govt_id_image_url_front: STRING,
  govt_id_image_url_back: STRING,
  profile_image_url: STRING,
  twitter: STRING,
  facebook: STRING,
  is_user_active: {
    type: Boolean,
    defaultValue: false
  },
  ratings: {
    type: FLOAT,
    defaultValue: false
    },
  created_at: { //T_USERS_Created_On => DD_CREATED_ON
    type: Date,
    defaultValue: currentTime
  },
}, {
    timestamps: false,
    underscore: true
  });

module.exports = User;
