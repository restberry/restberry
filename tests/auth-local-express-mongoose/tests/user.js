var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');


var EMAIL = 'test@restberry.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testReadMany = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createUser('a' + EMAIL, PASSWORD, function(userId) {
            testlib.client.get('users', function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.users.length, 2);
                for (var i in json.users) {
                    var user = json.users[i];
                    test.ok(user.id);
                    test.ok(!user.email);
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
            testlib.client.get('users' + qs, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.users.length, 2);
                for (var i in json.users) {
                    var user = json.users[i];
                    test.ok(user.id);
                    test.ok(user.email);
                }
                test.done();
            });
        });
    });
};

exports.testCreate = function(test) {
    testlib.client.post('users', {
        email: EMAIL,
        password: PASSWORD,
    }, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
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
    testlib.client.post('users', d, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        testlib.client.post('users', d, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CONFLICT);
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
    testlib.client.post('users', d1, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        testlib.client.post('users', d2, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            test.done();
        });
    });
};

exports.testActionMe = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.loginUser(EMAIL, PASSWORD, function(userId) {
            var path = 'users?action=me';
            testlib.client.get(path, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.user.id, userId);
                test.done();
            });
        });
    });
};

exports.testLogin = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.logoutUser(function() {
            testlib.client.post('login', {
                email: EMAIL,
                password: PASSWORD,
            }, function(err, res) {
                test.equal(res.statusCode, httpStatus.OK);
                test.done();
            });
        });
    });
};

exports.testWrongLogin = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.client.post('login', {
            email: 'x' + EMAIL,
            password: PASSWORD,
        }, function(err, res) {
            test.equal(res.statusCode, httpStatus.BAD_REQUEST);
            testlib.client.post('login', {
                email: EMAIL,
                password: 'x' + PASSWORD,
            }, function(err, res) {
                test.equal(res.statusCode, httpStatus.BAD_REQUEST);
                test.done();
            });
        });
    });
};

exports.testMissingPassword = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.client.post('login', {
            email: 'x' + EMAIL,
        }, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.BAD_REQUEST);
            test.ok(json.error);
            test.done();
        });
    });
};

exports.testLogout = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.logoutUser(function() {
            testlib.client.get('users?action=me', function(err, res, json) {
                test.equal(res.statusCode, httpStatus.UNAUTHORIZED);
                testlib.logoutUser(function() {
                    test.done();
                });
            });
        });
    });
};

exports.testUpdateEmail = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {email: 'bajs@bajs.com'};
        var path = 'users/' + userId;
        testlib.client.post(path, d, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            testlib.loginUser(d.email, PASSWORD, function() {
                test.done();
            });
        });
    });
};

exports.testUpdateName = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: {first: 'first', last: 'last'}};
        var path = 'users/' + userId;
        testlib.client.post(path, d, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.user.name.first, 'first');
            test.equal(json.user.name.last, 'last');
            var d = {name: {first: '', last: ''}};
            testlib.client.post(path, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
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
        var path = 'users/' + userId;
        testlib.client.post(path, d, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.BAD_REQUEST);
            testlib.loginUser(EMAIL, PASSWORD, function() {
                test.done();
            });
        });
    });
};

exports.testUpdatePassword = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {password: 'bajsbajs'};
        var path = 'users/' + userId;
        testlib.client.post(path, d, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            testlib.loginUser(EMAIL, d.password, function() {
                test.done();
            });
        });
    });
};
