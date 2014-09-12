var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');


var EMAIL = 'test@restberry.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testUnauthCreate = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.logoutUser(function() {
            var d = {name: 'test'};
            var path = '/users/' + userId + '/bazs';
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
        var path = '/users/' + userId + '/bazs';
        testlib.requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            test.equal(json.baz.nested.user.id, userId);
            test.done();
        });
    });
};

exports.testArray = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d1 = {name: 'test'}//, nested: {user: userId}};
        var path = '/users/' + userId + '/foos';
        testlib.requests.post(path, d1, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            var foo1 = json.foo.id;
            testlib.requests.post(path, d1, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                var foo2 = json.foo.id;
                var d2 = {
                    name: 'test',
                    nested: {
                        foos: [foo1, foo2],
                    }
                };
                var path = '/users/' + userId + '/bazs';
                testlib.requests.post(path, d2, function(code, json) {
                    test.equal(code, httpStatus.CREATED);
                    var foos = json.baz.nested.foos;
                    test.equal(foos.length, 2);
                    for (var i in foos) {
                        var foo = foos[i];
                        test.ok(foo.id);
                        test.ok(!foo.name);
                    }
                    test.done();
                });
            });
        });
    });
};

exports.testArrayExpand = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d1 = {name: 'test'};
        var path = '/users/' + userId + '/foos';
        testlib.requests.post(path, d1, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            var foo1 = json.foo.id;
            testlib.requests.post(path, d1, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                var foo2 = json.foo.id;
                var d2 = {
                    name: 'test',
                    nested: {
                        foos: [foo1, foo2],
                    }
                };
                var path = '/users/' + userId + '/bazs?expand=foos';
                testlib.requests.post(path, d2, function(code, json) {
                    test.equal(code, httpStatus.CREATED);
                    var foos = json.baz.nested.foos;
                    test.equal(foos.length, 2);
                    for (var i in foos) {
                        var foo = foos[i];
                        test.ok(foo.id);
                        test.ok(foo.name);
                    }
                    test.done();
                });
            });
        });
    });
};
