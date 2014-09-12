var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');


var QS_CODE = '4/yfyB6q7KLIiUTSTd9Ev55XyFcJNp.YoChNAV3TgUaoiIBeO6P2m8mj33AkAI';
var GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/auth';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testLoginFailed = function(test) {
    var path = '/login/google/callback';
    var qs = '?code=' + QS_CODE;
    testlib.requests.get(path + qs, function(code, json) {
        test.equal(code, httpStatus.BAD_REQUEST);
        test.done();
    });
};

exports.testLogin = function(test) {
    var path = '/login/google';
    testlib.requests.get(path, function(code, json, header) {
        var loc = header.location;
        test.ok(loc.indexOf(GOOGLE_OAUTH_URL) > -1);
        test.done();
    });
};
