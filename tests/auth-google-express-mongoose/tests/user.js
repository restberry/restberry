var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');


var QS_CODE = '4/yfyB6q7KLIiUTSTd9Ev55XyFcJNp.YoChNAV3TgUaoiIBeO6P2m8mj33AkAI';
var GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/auth';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testLoginFailed = function(test) {
    var path = 'login/google/callback';
    var qs = '?res.statusCode=' + QS_CODE;
    testlib.client.get(path + qs, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.BAD_REQUEST);
        test.done();
    });
};

//  exports.testLogin = function(test) {
//      var path = 'login/google';
//      testlib.client.get(path, function(err, res, json) {
//          var headers = res.headers;
//          console.log(headers);
//          console.log(json);
//          test.ok(headers['x-auto-login']);
//          test.done();
//      });
//  };
