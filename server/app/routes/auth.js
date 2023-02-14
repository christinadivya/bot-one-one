const router = require('express').Router();
const passport = require('passport');
const User = require('../../model/user');
const querystring = require('querystring');
const request = require('request');
const config = require('../../../config/configuration').data;


module.exports = {
  authUser: authUser
};

function authUser(req, res, next) {
  request({
    headers: {
      'Authorization': req.headers['authorization']
    },
    uri: config.ValidateAccessTokenURL,
    method: 'GET'
  }, function (err, response, body) {
    if (response.statusCode == 200) {
      next();
    } else if (response.statusCode == 401) {
      res.status(400).send({ "status": "Failed", statusCode: 400, error: 'Invalid token' });
    }
  });
}
