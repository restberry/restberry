var httpStatus = require('http-status');
var testlib = require('../testlib');


var EMAIL = 'test@restberry.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testReadMany = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var path = '/users/' + userId + '/foos';
        testlib.requests.post(path, d1, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            testlib.requests.post(path, d2, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                testlib.requests.get(path, function(code, json) {
                    test.equal(code, httpStatus.OK);
                    test.equal(json.foos.length, 2);
                    for (var i in json.foos) {
                        var foo = json.foos[i];
                        test.ok(foo.id);
                        test.ok(!foo.name);
                    }
                    test.ok(json.hrefs.current);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyExpand = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var path = '/users/' + userId + '/foos?expand=foo';
        testlib.requests.post(path, d1, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            testlib.requests.post(path, d2, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                testlib.requests.get(path, function(code, json) {
                    test.equal(code, httpStatus.OK);
                    test.equal(json.foos.length, 2);
                    for (var i in json.foos) {
                        var foo = json.foos[i];
                        test.ok(foo.id);
                        test.ok(foo.name);
                        test.ok(foo.user);
                    }
                    test.ok(json.hrefs.current);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyFields = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var qs = '?expand=foo&fields=name';
        var path = '/users/' + userId + '/foos' + qs;
        testlib.requests.post(path, d1, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            testlib.requests.post(path, d2, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                testlib.requests.get(path, function(code, json) {
                    test.equal(code, httpStatus.OK);
                    test.equal(json.foos.length, 2);
                    for (var i in json.foos) {
                        var foo = json.foos[i];
                        test.ok(foo.id);
                        test.ok(foo.name);
                        test.ok(!foo.user);
                    }
                    test.ok(json.hrefs.current);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyFieldsNested = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var qs = '?expand=foo,user&fields=user,email';
        var path = '/users/' + userId + '/foos' + qs;
        testlib.requests.post(path, d1, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            testlib.requests.post(path, d2, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                testlib.requests.get(path, function(code, json) {
                    test.equal(code, httpStatus.OK);
                    test.equal(json.foos.length, 2);
                    for (var i in json.foos) {
                        var foo = json.foos[i];
                        test.ok(foo.id);
                        test.ok(foo.user);
                        test.ok(foo.user.email);
                        test.ok(!foo.user.timestampCreated);
                    }
                    test.ok(json.hrefs.current);
                    test.done();
                });
            });
        });
    });
};

exports.testUnauthCreate = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.logoutUser(function() {
            var d = {name: 'test'};
            var path = '/users/' + userId + '/foos';
            testlib.requests.post(path, d, function(code, json) {
                test.equal(code, httpStatus.UNAUTHORIZED);
                test.done();
            });
        });
    });
};

exports.testAuthCreate = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        var path = '/users/' + userId + '/foos';
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            test.equal(json.foo.user.id, userId);
            test.done();
        });
    });
};

exports.testUnauthRead = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.logoutUser(function() {
            var d = {name: 'test'};
            var path = '/users/' + userId + '/foos';
            testlib.requests.post(path, d, function(code, json) {
                test.equal(code, httpStatus.UNAUTHORIZED);
                testlib.requests.get(path, function(code, json) {
                    test.equal(code, httpStatus.UNAUTHORIZED);
                    test.done();
                });
            });
        });
    });
};

exports.testAuthRead = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        var path = '/users/' + userId + '/foos';
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            testlib.requests.get(path, function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.foos.length, 1);
                test.done();
            });
        });
    });
};

exports.testLogout = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        var path = '/users/' + userId + '/foos';
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            testlib.logoutUser(function() {
                testlib.requests.get(path, function(code, json) {
                    test.equal(code, httpStatus.UNAUTHORIZED);
                    test.done();
                });
            });
        });
    });
};

exports.testUnauthReadOtherUser = function(test) {
    var oldUserId = null;
    var oldFooId = null;
    var loginWithNewUser = function() {
        var path1 = '/users/' + oldUserId + '/foos';
        var path2 = '/foos/' + oldFooId;
        testlib.logoutUser(function() {
            testlib.createUser('hej@hej.com', PASSWORD, function(userId) {
                testlib.requests.get(path1, function(code, json) {
                    test.equal(code, httpStatus.FORBIDDEN);
                    testlib.requests.get(path2, function(code, json) {
                        test.equal(code, httpStatus.FORBIDDEN);
                        test.done();
                    });
                });
            });
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        var path = '/users/' + userId + '/foos';
        oldUserId = userId;
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            oldFooId = json.foo.id;
            testlib.requests.get(path, function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.foos.length, 1);
                loginWithNewUser();
            });
        });
    });
};
