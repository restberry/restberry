var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');


exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testReadMany = function(test) {
    testlib.requests.post('/bars', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var barId = json.bar.id;
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var path = '/bars/' + barId + '/foos';
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
    testlib.requests.post('/bars', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var barId = json.bar.id;
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var path = '/bars/' + barId + '/foos?expand=foo';
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
                        test.ok(foo.bar);
                    }
                    test.ok(json.hrefs.current);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyFields = function(test) {
    testlib.requests.post('/bars', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var barId = json.bar.id;
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var qs = '?expand=foo&fields=name';
        var path = '/bars/' + barId + '/foos' + qs;
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
                        test.ok(!foo.bar);
                    }
                    test.ok(json.hrefs.current);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyFieldsNested = function(test) {
    testlib.requests.post('/bars', {name: 'x'}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var barId = json.bar.id;
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var qs = '?expand=foo,bar&fields=bar,name';
        var path = '/bars/' + barId + '/foos' + qs;
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
                        test.ok(foo.bar);
                        test.ok(foo.bar.name);
                        test.ok(!foo.bar.timestampCreated);
                    }
                    test.ok(json.hrefs.current);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyAsync = function(test) {
    var i = 0, n = 3;
    var done = function() {
        i++; if (i === n)  test.done();
    };
    testlib.requests.post('/bars', {name: 'x'}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var barId = json.bar.id;
        var path = '/bars/' + barId + '/foos';
        testlib.requests.post(path, {name: 'x'}, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            var fooId = json.foo.id;
            var path = '/foos/' + fooId;
            var path1 = path + '?fields=id';
            testlib.requests.get(path1, function(code, json) {
                test.equal(code, httpStatus.OK);
                test.ok(!json.foo.name);
                test.ok(!json.foo.bar);
                done();
            });
            setTimeout(function() {
                var path2 = path + '?expand=foo';
                testlib.requests.get(path2, function(code, json) {
                    test.equal(code, httpStatus.OK);
                    test.ok(json.foo.name);
                    test.ok(json.foo.bar);
                    test.ok(!json.foo.bar.name);
                    done();
                });
                setTimeout(function() {
                    var path3 = path + '?expand=foo,bar';
                    testlib.requests.get(path3, function(code, json) {
                        test.equal(code, httpStatus.OK);
                        test.ok(json.foo.name);
                        test.ok(json.foo.bar);
                        test.ok(json.foo.bar.name);
                        done();
                    });
                }, 10);
            }, 10);
        });
    });
};
