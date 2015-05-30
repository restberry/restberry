var config = require('./config/config');
var restberry = require('restberry');
var restberryAuth = require('restberry-auth');
var restberryAuthLocal = require('restberry-auth-local');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var testlib = require('../testlib');
var utils = require('restberry-utils');

restberry
    .config(config.restberry)
    .use(restberryAuth
            .use(config.auth)
            .use(restberryAuthLocal.config(config.authLocal))
    )
    .use(restberryExpress.use(config.express))
    .use(restberryMongoose.use(config.mongoose))
    .listen();

require('./models/user')(restberry);
require('./models/organization')(restberry);
require('./models/team')(restberry);
require('./models/script')(restberry);
require('./models/activity')(restberry);

testlib.enableClearData(restberry);
