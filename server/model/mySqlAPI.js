 
'use strict';
 
var mysql           = require('mysql');
var q               = require('q');
var MySQLConnection = {};

MySQLConnection.connect = function(){
    var d = q.defer();
    // MySQLConnection.connection = mysql.createConnection({
    //     host                : '52.45.171.205',
    //     user                : 'root',
    //     password            : 'db@dm1n',
    //     database            : 'fetch39'
    // });

    // MySQLConnection.connection = mysql.createConnection({
    //     host                : '52.45.171.205',
    //     user                : 'root',
    //     password            : 'db@dm1n',
    //     database            : 'fetch39test'
    // });
    // MySQLConnection.connection = mysql.createConnection({
    //     host                : 'localhost',
    //     user                : 'root',
    //     password            : 'root',
    //     database            : 'fetch39'
    // });
    MySQLConnection.connection = mysql.createConnection({
        host                : '172.31.20.177',
        user                : 'fetch39',
        password            : 'Opt!dev_$%^_!@#',
        database            : 'fetch39'
    });
    


    MySQLConnection.connection.connect(function (err) {
        if(err) {
            console.log('Not connected '.red, err.toString().red, ' RETRYING...'.blue);
            d.reject();
        } else {
            console.log('Connected to Mysql. Exporting..'.blue);
            d.resolve(MySQLConnection.connection);
        }
    });
    return d.promise;
};

module.exports = MySQLConnection;



//===============================
// var mysqlCon        = require('./DB_connection');
// mysqlCon.connect().then(function(con){
//    console.log('connected!');
//     mysql = con;
//     mysql.on('error', function (err, result) {
//         console.log('error occurred. Reconneting...'.purple);
//         mysqlAPI.reconnect();
//     });
//     mysql.query('SELECT 1 + 1 AS solution', function (err, results) {
//             if(err) console.log('err',err);
//             console.log('Works bro ',results);
//     });
// });

// mysqlAPI.reconnect = function(){
//     mysqlCon.connect().then(function(con){
//       console.log("connected. getting new reference");
//         mysql = con;
//         mysql.on('error', function (err, result) {
//             mysqlAPI.reconnect();
//         });
//     }, function (error) {
//       console.log("try again");
//         setTimeout(mysqlAPI.reconnect(), 2000);
//     });
// };