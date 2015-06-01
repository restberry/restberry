var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require('../../testlib');

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    var data = {
        list: [
            {a: 1, b: 'hell'},
            {a: 2, b: 'yeah'},
        ],
    };
    testlib.client.post('foobars', data, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        test.ok(json.foobar);
        test.deepEqual(json.foobar.list, data.list);
        test.done();
    });
};

exports.testReadMany = function(test) {
    var data = {
        list: [
            {a: 1, b: 'hell'},
            {a: 2, b: 'yeah'},
        ],
    };
    testlib.client.post('foobars', data, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var path = 'foobars?expand=foobar';
        testlib.client.get(path, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.foobars.length, 1);
            test.deepEqual(json.foobars[0].list, data.list);
            test.done();
        });
    });
};

