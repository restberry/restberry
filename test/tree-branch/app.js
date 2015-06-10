var config = require('./config/config');
var restberry = require('restberry');
var restberryPassport = require('restberry-passport');
var restberryPassportLocal = require('restberry-passport-local');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var testlib = require('../testlib');
var utils = require('restberry-utils');

var auth = restberryPassport
    .config(config.auth)
    .use(restberryPassportLocal, config.authLocal);

restberry
    .config(config.restberry)
    .use(auth)
    .use(restberryExpress, config.express)
    .use(restberryMongoose, config.mongoose)
    .listen();

require('./models/user')(restberry);
require('./models/organization')(restberry);
require('./models/team')(restberry);
require('./models/script')(restberry);
require('./models/activity')(restberry);

testlib.enableClearData(restberry);
