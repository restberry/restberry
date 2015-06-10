var config = require('./config/config');
var restberry = require('restberry');
var restberryPassport = require('restberry-passport');
var restberryPassportGoogle = require('restberry-passport-google');
var restberryPassportLocal = require('restberry-passport-local');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');

restberry
    .config(config.restberry)
    .use(restberryPassport
            .config(config.restberryAuth)
            .use(restberryPassportGoogle.config(config.restberryAuthGoogle))
            .use(restberryPassportLocal.config(config.restberryAuthLocal))
    )
    .use(restberryExpress.config(config.restberryExpress))
    .use(restberryMongoose.config(config.restberryMongoose))
    .listen();

require('./models/connection')(restberry);
require('./models/collab')(restberry);
require('./models/user')(restberry);

require('./config/routes')(restberry);
