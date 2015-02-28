var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');

var TEST_USER_1 = {
    ids: {
        google: '1234567',
    },
    email: 'test@likeminded.com',
    name: {
        full: 'Mattias Eriksson',
        first: 'Mattias',
        last: 'Eriksson',
    },
};
var TEST_USER_2 = {
    ids: {
        google: '12345678',
    },
    email: 'test1@likeminded.com',
    name: {
        full: 'Niklas Andersson',
        first: 'Niklas',
        last: 'Andersson',
    },
};
var TEST_USERS = [TEST_USER_1, TEST_USER_2];

exports = _.defaults(exports, testlib);

exports.createCollab = function(d, next) {
    testlib.client.post('collabs', d, function(err, res, json) {
        if (res.statusCode == httpStatus.CREATED)  next(json.collab.id);
    });
};

exports.login = function(next, userId) {
    if (!userId)  userId = 0;
    var user = TEST_USERS[userId];
    testlib.client.post('users', user, function(err, res, json) {
        testlib.session.start(res);
        exports.client = testlib.client;
        var userId = json.user.id;
        next(userId);
    });
};

exports.logoutUser = function(next) {
    testlib.client.get('logout', function(err, res) {
        testlib.session.end();
        exports.client = testlib.client;
        if (res.statusCode === httpStatus.NO_CONTENT)  next();
    });
};
