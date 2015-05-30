var _ = require('underscore');
var httpStatus = require('http-status');
var request = require('request-json');
var utils = require('restberry-utils');
var util = require('util');

var API_PATH = '/api/v1/';
var COOKIE_SEARCH_VAL = /;.*/;
var COOKIE_REPLACE_VAL = '';
var HEADER_KEY_COOKIE = 'Cookie';
var HEADER_KEY_SET_COOKIE = 'set-cookie';
var HOST = process.env.NODE_HOST || 'localhost';
var PATH_CLEAR_DATA = 'dev/clearData';
var PORT = process.env.NODE_PORT || 6000;

var URL = util.format('http://%s:%s%s', HOST, PORT, API_PATH);

exports.setupTeardown = function(next) {
    client.get(PATH_CLEAR_DATA, function(err, res, body) {
        next();
    });
};

exports.createUser = function(email, password, next) {
    client.post('users', {
        email: email,
        password: password,
    }, function(err, res, json) {
        if (res.statusCode === httpStatus.CREATED) {
            exports.session.start(res);
            next(json.user.id);
        }
    });
};

exports.loginUser = function(email, password, next) {
    client.post('login', {
        email: email,
        password: password,
    }, function(err, res, json) {
        if (res.statusCode === httpStatus.OK) {
            exports.session.start(res);
            next(json.user.id);
        }
    });
};

exports.logoutUser = function(next) {
    client.get('logout', function(err, res) {
        if (res.statusCode === httpStatus.NO_CONTENT) {
            exports.session.end();
            next();
        }
    });
};

exports.session = {

    end: function() {
        client = request.createClient(URL);
        exports.client = client;
    },

    extractCookie: function(res) {
        if (res) {
            var cookies = res.headers[HEADER_KEY_SET_COOKIE];
            if (cookies && cookies.length) {
                var cookie = cookies.shift();
                return cookie.replace(COOKIE_SEARCH_VAL, COOKIE_REPLACE_VAL);
            }
        }
        return undefined;
    },

    setCookie: function(cookie) {
        if (cookie) {
            var options = {};
            options.headers = {};
            options.headers[HEADER_KEY_COOKIE] = cookie;
            client = request.createClient(URL, options);
            exports.client = client;
        }
    },

    start: function(res) {
        var cookie = exports.session.extractCookie(res);
        if (cookie)  exports.session.setCookie(cookie);
    },

};

exports.enableClearData = function(restberry) {
    restberry.routes.addCustomRoute({
        path: '/' + PATH_CLEAR_DATA,
        action: function(req, res, next) {
            exports.clearData(restberry, function() {
                res.status(httpStatus.NO_CONTENT);
                restberry.waf.handleRes({}, req, res, next);
            });
        },
    });
};

exports.clearData = function(restberry, next) {
    var models = restberry.odm.mongoose.models;
    var keys = Object.keys(models);
    utils.forEachAndDone(keys, function(key, iter) {
        var model = models[key];
        model.remove(iter);
    }, next);
};

exports.session.end();
