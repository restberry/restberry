var httpStatus = require('http-status');
var testlib = require('../testlib');


var EMAIL = 'test@restberry.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    testlib.requests.post('/users', {
        email: EMAIL,
        password: PASSWORD,
    }, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        test.equal(json.user.username, EMAIL);
        test.equal(json.user.email, EMAIL);
        test.equal(json.user.password, '**********');
        test.done();
    });
};

exports.testCreateConflict = function(test) {
    var d = {
        email: EMAIL,
        password: PASSWORD,
    };
    testlib.requests.post('/users', d, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        testlib.requests.post('/users', d, function(code, json) {
            test.equal(code, httpStatus.CONFLICT);
            test.done();
        });
    });
};

exports.testCreateMany = function(test) {
    var d1 = {
        email: EMAIL,
        password: PASSWORD,
    };
    var d2 = {
        email: 'x' + EMAIL,
        password: PASSWORD,
    };
    testlib.requests.post('/users', d1, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        testlib.requests.post('/users', d2, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            test.done();
        });
    });
};

exports.testActionMe = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.loginUser(EMAIL, PASSWORD, function(userId) {
            var path = '/users?action=me';
            testlib.requests.get(path, function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.user.id, userId);
                test.done();
            });
        });
    });
};
