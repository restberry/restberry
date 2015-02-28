var config = require('./config/config');
var restberry = require('restberry');
var restberryAuth = require('restberry-auth');
var restberryAuthGoogle = require('restberry-auth-google');
var restberryAuthLocal = require('restberry-auth-local');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');

restberry
    .config(config.restberry)
    .use(restberryAuth
            .use(config.restberryAuth)
            .use(restberryAuthGoogle.config(config.restberryAuthGoogle))
            .use(restberryAuthLocal.config(config.restberryAuthLocal))
    )
    .use(restberryExpress.use(config.restberryExpress))
    .use(restberryMongoose.use(config.restberryMongoose))
    .listen();

require('./models/connection')(restberry);
require('./models/collab')(restberry);
require('./models/user')(restberry);

require('./config/routes')(restberry);
