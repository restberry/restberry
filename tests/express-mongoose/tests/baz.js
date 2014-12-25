var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');


exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    testlib.requests.post('/bazs', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        test.ok(!json.baz.nested);
        test.done();
    });
};

exports.testNestedTwice = function(test) {
    testlib.requests.post('/bazs', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.requests.post('/bazs', {
            nested: {
                obj: id1
            },
        }, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            test.ok(json.baz.nested);
            test.equal(json.baz.nested.obj.id, id1);
            test.ok(!json.baz.nested.obj.nested);
            test.done();
        });
    });
};

exports.testNestedTwiceExpand = function(test) {
    testlib.requests.post('/bazs', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.requests.post('/bazs?expand=obj', {
            nested: {
                obj: id1
            },
        }, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            test.ok(json.baz.nested);
            test.equal(json.baz.nested.obj.id, id1);
            test.ok(!json.baz.nested.obj.nested);
            test.done();
        });
    });
};

exports.testNestedThrice = function(test) {
    testlib.requests.post('/bazs', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.requests.post('/bazs', {
            nested: {
                obj: id1
            },
        }, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            var id2 = json.baz.id;
            testlib.requests.post('/bazs', {
                nested: {
                    obj: id2
                },
            }, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                test.ok(json.baz.nested);
                test.equal(json.baz.nested.obj.id, id2);
                test.ok(!json.baz.nested.obj.nested);
                test.done();
            });
        });
    });
};

exports.testNestedThriceExpand = function(test) {
    testlib.requests.post('/bazs', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.requests.post('/bazs?expand=obj', {
            nested: {
                obj: id1
            },
        }, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            test.ok(json.baz.nested);
            var id2 = json.baz.id;
            testlib.requests.post('/bazs?expand=obj', {
                nested: {
                    obj: id2
                },
            }, function(code, json) {
                test.equal(code, httpStatus.CREATED);
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
    testlib.requests.post('/bazs', {}, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id1 = json.baz.id;
        testlib.requests.post('/bazs?expand=obj', {
            nested: {
                obj: id1
            },
        }, function(code, json) {
            test.equal(code, httpStatus.CREATED);
            test.ok(json.baz.nested);
            var id2 = json.baz.id;
            testlib.requests.post('/bazs/' + id1 + '?expand=obj', {
                nested: {
                    obj: id2
                },
            }, function(code, json) {
                test.equal(code, httpStatus.OK);
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
