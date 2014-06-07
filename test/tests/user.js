var httpStatus = require('http-status');
var testlib = require('../testlib');


var EMAIL = 'test@restberry.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testReadMany = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createUser('a' + EMAIL, PASSWORD, function(userId) {
            testlib.requests.get('/users', function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.users.length, 2);
                for (var i in json.users) {
                    var user = json.users[i];
                    test.ok(user.id);
                    test.ok(!user.username);
                }
                test.done();
            });
        });
    });
};

exports.testReadManyExpand = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createUser('a' + EMAIL, PASSWORD, function(userId) {
            var qs = '?expand=user';
            testlib.requests.get('/users' + qs, function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.users.length, 2);
                for (var i in json.users) {
                    var user = json.users[i];
                    test.ok(user.id);
                    test.ok(user.username);
                }
                test.done();
            });
        });
    });
};

exports.testCreate = function(test) {
    testlib.requests.post('/users', {
        email: EMAIL,
        password: PASSWORD,
    }, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        test.equal(json.user.username, EMAIL);
        test.equal(json.user.email, EMAIL);
        test.ok(!json.user.password);
        test.done();
    });
};

exports.testCreateWithUsername = function(test) {
    var username = 'test';
    testlib.requests.post('/users', {
        username: username,
        email: EMAIL,
        password: PASSWORD,
    }, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        test.equal(json.user.username, username);
        test.equal(json.user.email, EMAIL);
        test.ok(!json.user.password);
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

exports.testLogin = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.logoutUser(function() {
            testlib.requests.post('/login', {
                username: EMAIL,
                password: PASSWORD,
            }, function(code) {
                test.equal(code, httpStatus.OK);
                test.done();
            });
        });
    });
};

exports.testWrongLogin = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.requests.post('/login', {
            username: 'x' + EMAIL,
            password: PASSWORD,
        }, function(code) {
            test.equal(code, httpStatus.BAD_REQUEST);
            testlib.requests.post('/login', {
                username: EMAIL,
                password: 'x' + PASSWORD,
            }, function(code) {
                test.equal(code, httpStatus.BAD_REQUEST);
                test.done();
            });
        });
    });
};

exports.testLogout = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.logoutUser(function() {
            testlib.requests.get('/users?action=me', function(code, json) {
                test.equal(code, httpStatus.UNAUTHORIZED);
                testlib.logoutUser(function() {
                    test.done();
                });
            });
        });
    });
};

exports.testUpdateUsername = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {username: 'bajs'};
        var path = '/users/' + userId;
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.OK);
            testlib.loginUser(d.username, PASSWORD, function() {
                test.done();
            });
        });
    });
};

exports.testUpdateName = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: {first: 'first', last: 'last'}};
        var path = '/users/' + userId;
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.OK);
            test.equal(json.user.name.first, 'first');
            test.equal(json.user.name.last, 'last');
            var d = {name: {first: '', last: ''}};
            testlib.requests.post(path, d, function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.user.name.first, '');
                test.equal(json.user.name.last, '');
                test.done();
            });
        });
    });
};

exports.testUpdateIllegalPassword = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {password: 'bajs'};
        var path = '/users/' + userId;
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.BAD_REQUEST);
            testlib.loginUser(EMAIL, PASSWORD, function() {
                test.done();
            });
        });
    });
};

exports.testUpdatePassword = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {password: 'bajsbajs'};
        var path = '/users/' + userId;
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.OK);
            testlib.loginUser(EMAIL, d.password, function() {
                test.done();
            });
        });
    });
};
