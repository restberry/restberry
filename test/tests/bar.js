var httpStatus = require('http-status');
var testlib = require('../testlib');


exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    var d = {name: 'test'};
    testlib.requests.post('/bars', d, function(code) {
        test.equal(code, httpStatus.CREATED);
        test.done();
    });
};

exports.testCreateConflict = function(test) {
    var d = {name: 'test'};
    testlib.requests.post('/bars', d, function(code) {
        test.equal(code, httpStatus.CREATED);
        testlib.requests.post('/bars', d, function(code) {
            test.equal(code, httpStatus.CONFLICT);
            test.done();
        });
    });
};

exports.testReadMany = function(test) {
    testlib.requests.get('/bars', function(code, json) {
        test.equal(code, httpStatus.OK);
        test.equal(json.bars.length, 0);
        var d = {name: 'test'};
        testlib.requests.post('/bars', d, function(code) {
            test.equal(code, httpStatus.CREATED);
            testlib.requests.get('/bars', function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.bars.length, 1);
                test.done();
            });
        });
    });
};

exports.testDelete = function(test) {
    var d = {name: 'test'};
    testlib.requests.post('/bars', d, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id = json.bar.id;
        testlib.requests.del('/bars/' + id, function(code) {
            test.equal(code, httpStatus.NO_CONTENT);
            testlib.requests.get('/bars', function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.bars.length, 0);
                test.done();
            });
        });
    });
};
