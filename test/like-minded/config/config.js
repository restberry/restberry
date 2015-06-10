var restberryAuth = require('./auth');
var restberryExpress = require('./express');
var restberryMongoose = require('./mongoose');


var ENV_DEV = 'dev';
var ENV_PROD = 'prod';
var GOOGLE_CALLBACK_HOST_DEV = 'http://localhost'
var GOOGLE_CALLBACK_HOST_PROD = 'http://like-minded.com'

var API_PATH = '/api/v1';
var DEBUG = 'true';
var ENV = ENV_DEV;
var NAME = 'LIKE-MINDED';
var PORT = process.env.NODE_PORT || 6000;

var GOOGLE_CLIENT_ID = '23835612237-i40710qkfdcnemedvvn17g7aoufmiuk9.' +
                       'apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'MlVq-52ds_lbUl28ntfQ2TOa';
var GOOGLE_CALLBACK_HOST = (ENV === ENV_DEV ?
                                GOOGLE_CALLBACK_HOST_DEV :
                                GOOGLE_CALLBACK_HOST_PROD)

module.exports = {
    debug: DEBUG,
    isProd: ENV === ENV_PROD,
    isDev: ENV === ENV_DEV,
    restberry: {
        apiPath: API_PATH,
        env: ENV,
        name: NAME,
        port: PORT,
        verbose: DEBUG,
    },
    restberryAuth: restberryAuth,
    restberryAuthGoogle: {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackHost: GOOGLE_CALLBACK_HOST,
    },
    restberryAuthLocal: {
    },
    restberryExpress: restberryExpress,
    restberryMongoose: restberryMongoose,
};
