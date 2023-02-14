const Sequelize = require('sequelize');
const config = require('../../config/configuration').data.database;

// const db = new Sequelize({
//   dialect: config.dialect,
//   dialectModulePath: config.dialectModulePath,
//   dialectOptions: {
//     connectionString: config.connectionString
//   },
//   // operatorsAliases: false
// });

// const db = new Sequelize('Converse', 'CNVSLOGIN', 'cnvs#123dev', {
//   dialect: 'mssql',
//   host: 'eipdevdb' //'172.31.60.84'
// })
const options = {
    host: '172.31.20.177',
    dialect: 'mssql',
    pool: {
      max: 1,
      min: 0,
      idle: 5000,
      acquire: 5000
    },
    dialectOptions: {
      requestTimeout: 5000
    },
  };

const db = new Sequelize('fetch39', 'fetch39', 'Opt!dev_$%^_!@#',{
    dialect: 'mysql',
    host: '172.31.20.177',
    server: '172.31.20.177',
    database: 'fetch39'
  })
// const db = new Sequelize('deelchat', 'root', 'db@dm1n',{
//     dialect: 'mysql',
//     host: '34.218.121.25',
//     server: '34.218.121.25',
//     database: 'deelchat'
// })
// const db = new Sequelize('fetch39', 'root', 'db@dm1n',{
//   dialect: 'mysql',
//   host: '52.45.171.205',
//   server: '52.45.171.205',
//   database: 'fetch39'
// })
// const db = new Sequelize('fetch39test', 'root', 'db@dm1n',{
//   dialect: 'mysql',
//   host: '52.45.171.205',
//   server: '52.45.171.205',
//   database: 'fetch39test'
// })
// const db = new Sequelize('Converse_New', 'sql', 'Optisol@123', {
//   dialect: 'mssql',
//   host: '192.168.1.99',
//     server: ' 192.168.1.99',
//     database: 'Converse_New'
//  })

module.exports = db;
