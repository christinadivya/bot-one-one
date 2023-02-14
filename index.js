const express = require('express');
const path = require('path');
 
const morgan = require('morgan');
const winston = require('./config/winston');
const config = require('./config/configuration');
 
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const app = express();
 
const routes = require('./server/app/routes');
const db = require('./server/model');
const formidable = require('formidable');
 
const port = process.env.PORT || config.apiPort;
 
 
// CORS Issue Fix
app.use(function(req, res, next) {                            
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
 

// Socket setup
const socketio = require('socket.io');
const http = require('http');
const server = http.createServer();
server.on('request', app);

var options  = { origins :  "*:*"}
// var options  = { path: '/node/ConverseChatAPI/socket.io', origins :  "*:*"}
const io = socketio(server, options);
 
const socketEvents = require('./server/app/sockets');
socketEvents(io, app);
 
// Logging Middleware
app.use(morgan('combined', { stream: winston.stream })); //dev
 
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : err;   //? err : {};
 
  // add this line to include winston logging
  winston.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
 
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
 

// Server up static files from '../../public'
app.use(express.static(path.join(__dirname, 'public')));
 
// Body parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'invalid secret key',
  resave: false,
  saveUninitialized: false,
}));
 
// Authentication Middleware
// app.use(passport.initialize());
// app.use(passport.session());
 

// cofiguring body-parser
app.use(bodyParser.json({ // setting json limit   
    limit: 1024 * 10000
}));
app.use(bodyParser.text({   // setting text limit
    limit: 1024 * 10000
}));
app.use(bodyParser.raw({  // setting raw limit
    limit: 1024 * 10000
}));
 
 

// Reroute to /api
// app.use('/node/ConverseChatAPI/iisserver.js/api', routes);
app.use('/api', routes);

// app.post('/chat/uploadDocs', function (req, res) {
//   console.log("@######################")
// })
 
// Sync database then start listening if we are running the file directly
// Needed to remove errors during http testing
//if (module === require.main) {
  server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
//}
 
module.exports = app;
 