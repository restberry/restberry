var httpStatus = require('http-status');
var requests = require('http-requests');
var utils = require('restberry-utils');


var DB = 'mongodb://localhost/restberry-npm';
requests.config({
    apiPath: '/api/v1',
    host: process.env.NODE_HOST || 'localhost',
    port: process.env.NODE_PORT || 6000,
    ssl: false,
    verbose: process.env.NODE_DEBUG === 'true' || false,
});

exports.requests = requests;

exports.setupTeardown = function(next) {
    requests.get('/dev/clearData', function() {
        next();
    });
};

exports.createUser = function(email, password, next) {
    requests.post('/users', {
        email: email,
        password: password,
    }, function(code, json) {
        if (code === httpStatus.CREATED)  next(json.user.id);
    });
};

exports.loginUser = function(email, password, next) {
    requests.post('/login', {
        email: email,
        password: password,
    }, function(code, json) {
        if (code === httpStatus.OK)  next(json.user.id);
    });
};

exports.logoutUser = function(next) {
    requests.get('/logout', function(code) {
        if (code === httpStatus.NO_CONTENT)  next();
    });
};

exports.enableClearData = function(restberry) {
    restberry.routes.addCustomRoute({
        path: '/dev/clearData',
        action: function(req, res, next) {
            var models = restberry.odm.mongoose.models;
            var keys = Object.keys(models);
            utils.forEachAndDone(keys, function(key, iter) {
                var model = models[key];
                model.remove(iter);
            }, function() {
                res.status(httpStatus.NO_CONTENT);
                restberry.waf.handleRes({}, req, res, next);
            });
        },
    });
};
