var httpStatus = require('http-status');
var testlib = require('../../testlib');

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    testlib.client.post('bazs', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        test.ok(!json.baz.nested);
        test.done();
    });
};

exports.testNestedTwice = function(test) {
    testlib.client.post('bazs', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.client.post('bazs', {
            nested: {
                obj: id1
            },
        }, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            test.ok(json.baz.nested);
            test.equal(json.baz.nested.obj.id, id1);
            test.ok(!json.baz.nested.obj.nested);
            test.done();
        });
    });
};

exports.testNestedTwiceExpand = function(test) {
    testlib.client.post('bazs', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.client.post('bazs?expand=obj', {
            nested: {
                obj: id1
            },
        }, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            test.ok(json.baz.nested);
            test.equal(json.baz.nested.obj.id, id1);
            test.ok(!json.baz.nested.obj.nested);
            test.done();
        });
    });
};

exports.testNestedThrice = function(test) {
    testlib.client.post('bazs', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.client.post('bazs', {
            nested: {
                obj: id1
            },
        }, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            var id2 = json.baz.id;
            testlib.client.post('bazs', {
                nested: {
                    obj: id2
                },
            }, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                test.ok(json.baz.nested);
                test.equal(json.baz.nested.obj.id, id2);
                test.ok(!json.baz.nested.obj.nested);
                test.done();
            });
        });
    });
};

exports.testNestedThriceExpand = function(test) {
    testlib.client.post('bazs', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.client.post('bazs?expand=obj', {
            nested: {
                obj: id1
            },
        }, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            test.ok(json.baz.nested);
            var id2 = json.baz.id;
            testlib.client.post('bazs?expand=obj', {
                nested: {
                    obj: id2
                },
            }, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                test.ok(json.baz.nested);
                test.equal(json.baz.nested.obj.id, id2);
                test.ok(json.baz.nested.obj.nested);
                test.ok(!json.baz.nested.obj.nested.obj.nested);
                test.done();
            });
        });
    });
};

exports.testNestedSelf = function(test) {
    testlib.client.post('bazs', {}, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.client.post('bazs?expand=obj', {
            nested: {
                obj: id1
            },
        }, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            test.ok(json.baz.nested);
            var id2 = json.baz.id;
            testlib.client.post('bazs/' + id1 + '?expand=obj', {
                nested: {
                    obj: id2
                },
            }, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.ok(json.baz.nested);
                test.equal(json.baz.nested.obj.id, id2);
                test.ok(json.baz.nested.obj.nested);
                test.ok(json.baz.nested.obj.nested.obj.id, id1);
                test.ok(!json.baz.nested.obj.nested.obj.nested);
                test.done();
            });
        });
    });
};
