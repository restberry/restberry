var auth = require('./auth');
var express = require('./express');

var DB = 'mongodb://localhost/restberry-test';
var DEBUG = 'true';
var ENV_DEV = 'dev';
var ENV_PROD = 'prod';
var ENV = ENV_DEV;
var PORT = process.env.NODE_PORT || 6000;

module.exports = {
    auth: auth,
    authLocal: {
        additionalFields: {
            imageURL: {type: String},
            name: {
                first: {type: String},
                last: {type: String},
            },
        },
    },
    debug: DEBUG,
    env: ENV,
    express: express,
    isProd: ENV === ENV_PROD,
    isDev: ENV === ENV_DEV,
    restberry: {
        apiPath: '/api/v1',
        env: ENV,
        name: 'SALES-BRANCH',
        port: PORT,
        verbose: DEBUG,
    },
    mongoose: function(odm) {
        odm.connect(DB);
    },
};
