// let config = {
//     host    : '34.218.121.25',
//     user    : 'root',
//     password: 'db@dm1n',
//     database: 'deelchattest'
//   };
   

//   module.exports = config;
const config = require('../../config/configuration')

 
// const knex = require('knex')({
//   client: 'mysql',
//   connection: {
//   host : '52.45.171.205',
//   port: 3306,
//   user : 'root',
//   password : 'db@dm1n',
//   database :"fetch39", 
//    charset : 'utf8mb4',
//   // collate: "utf8mb4_unicode_ci",
//   multipleStatements: true
//   }
//   });

  // const knex = require('knex')({
  //   client: 'mysql',
  //   connection: {
  //   host : '52.45.171.205',
  //   port: 3306,
  //   user : 'root',
  //   password : 'db@dm1n',
  //   database :"fetch39test", 
  //    charset : 'utf8mb4',
  //   // collate: "utf8mb4_unicode_ci",
  //   multipleStatements: true
  //   }
  //   });
   
  const knex = require('knex')({
    client: 'mysql',
    connection: {
    host : '172.31.20.177',
    port: 3306,
    user : 'fetch39',
    password : 'Opt!dev_$%^_!@#',
    database :"fetch39", 
     charset : 'utf8mb4',
    // collate: "utf8mb4_unicode_ci",
    multipleStatements: true
    }
    });
   
  // const Bookshelf = require('bookshelf')(knex);
 
    
  module.exports= knex;