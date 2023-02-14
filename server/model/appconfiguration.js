const { Sequelize, INTEGER, STRING, VIRTUAL, DATE, BOOLEAN, UUID } = require('sequelize');
const db = require('./_db');
const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

const AppConfiguration = db.define('CON_T_AppConfigurations', {
  TAppConfigurations_AppConfigurationID: {
    allowNull: false,
    autoIncrement: true,
    type: UUID,
    primaryKey: true
  },
  TAppConfigurations_AppKey: STRING,
  TAppConfigurations_AppValue: STRING
}, {
    timestamps: false,
    underscore: true
  });

module.exports = AppConfiguration;
