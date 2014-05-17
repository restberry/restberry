var httpStatus = require('http-status');
var mongoose = require('mongoose');
var requests = require('http-requests');


var DB = 'mongodb://localhost/restberry-npm';
requests.config({
    apiPath: '/api/v1',
    host: 'dev1',
    port: 6000,
    ssl: false,
    verbose: true,
});

exports.requests = requests;

exports.setupTeardown = function(next) {
    requests.get('/clearData', function() {
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

exports.loginUser = function(username, password, next) {
    requests.post('/login', {
        username: username,
        password: password,
    }, function(code, json) {
        if (code === httpStatus.OK)  next(json.user.id);
    });
};

exports.createAndLoginUser = function(email, password, next) {
    var self = this;
    self.createUser(email, password, function() {
        self.loginUser(email, password, next);
    });
};

exports.logoutUser = function(next) {
    requests.get('/logout', function(code) {
        if (code === httpStatus.NO_CONTENT)  next();
    });
};
