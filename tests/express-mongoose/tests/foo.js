var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testReadMany = function(test) {
    testlib.client.post('bars', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var barId = json.bar.id;
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var path = 'bars/' + barId + '/foos';
        testlib.client.post(path, d1, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            testlib.client.post(path, d2, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
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

exports.testReadManyPaginator = function(test) {
    var createFeeds = function(nbrOfFeeds, barId, callback) {
        var d = {name: 'test' + nbrOfFeeds};
        var path = 'bars/' + barId + '/foos';
        testlib.client.post(path, d, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            if (--nbrOfFeeds) {
                createFeeds(nbrOfFeeds, barId, callback);;
            } else {
                callback();
            }
        });
    };
    testlib.client.post('bars', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var barId = json.bar.id;
        var total = 10;
        createFeeds(total, barId, function() {
            var limit = 5;
            var path = 'bars/' + barId + '/foos?limit=' + limit;
            testlib.client.get(path, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.foos.length, limit);
                test.equal(json.limit, limit);
                test.equal(json.total, total);
                test.done();
            });
        });
    });
};

exports.testReadManyPaginatorSort = function(test) {
    var createFeeds = function(nbrOfFeeds, barId, callback) {
        var d = {name: 'test' + (nbrOfFeeds < 10 ? '0' : '') + nbrOfFeeds};
        var path = 'bars/' + barId + '/foos';
        testlib.client.post(path, d, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            if (--nbrOfFeeds) {
                createFeeds(nbrOfFeeds, barId, callback);;
            } else {
                callback();
            }
        });
    };
    testlib.client.post('bars', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var barId = json.bar.id;
        var total = 10;
        createFeeds(total, barId, function() {
            var limit = 5;
            var path = 'bars/' + barId + '/foos?expand=foo&limit=' + limit;
            var pathAsc = path + '&sort=name';
            var pathDesc = path + '&sort=-name';
            testlib.client.get(pathAsc, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(_.first(json.foos).name, 'test01');
                testlib.client.get(pathDesc, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(_.first(json.foos).name, 'test' + total);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyExpand = function(test) {
    testlib.client.post('bars', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var barId = json.bar.id;
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var path = 'bars/' + barId + '/foos?expand=foo';
        testlib.client.post(path, d1, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            testlib.client.post(path, d2, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
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
    testlib.client.post('bars', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var barId = json.bar.id;
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var qs = '?expand=foo&fields=name';
        var path = 'bars/' + barId + '/foos' + qs;
        testlib.client.post(path, d1, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            testlib.client.post(path, d2, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
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
    testlib.client.post('bars', {name: 'x'}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var barId = json.bar.id;
        var d1 = {name: 'test1'};
        var d2 = {name: 'test2'};
        var qs = '?expand=foo,bar&fields=bar,name';
        var path = 'bars/' + barId + '/foos' + qs;
        testlib.client.post(path, d1, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            testlib.client.post(path, d2, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
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
    testlib.client.post('bars', {name: 'x'}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var barId = json.bar.id;
        var path = 'bars/' + barId + '/foos';
        testlib.client.post(path, {name: 'x'}, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            var fooId = json.foo.id;
            var path = 'foos/' + fooId;
            var path1 = path + '?fields=id';
            testlib.client.get(path1, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.ok(!json.foo.name);
                test.ok(!json.foo.bar);
                done();
            });
            setTimeout(function() {
                var path2 = path + '?expand=foo';
                testlib.client.get(path2, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.ok(json.foo.name);
                    test.ok(json.foo.bar);
                    test.ok(!json.foo.bar.name);
                    done();
                });
                setTimeout(function() {
                    var path3 = path + '?expand=foo,bar';
                    testlib.client.get(path3, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        test.ok(json.foo.name);
                        test.ok(json.foo.bar);
                        test.ok(json.foo.bar.name);
                        done();
                    });
                }, 1);
            }, 1);
        });
    });
};
