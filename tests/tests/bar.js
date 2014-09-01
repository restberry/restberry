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

exports.testPartialUpdate = function(test) {
    var name1 = 'test';
    var d1 = {name: name1};
    var name2 = 'new test';
    var d2 = {name: name2};
    testlib.requests.post('/bars', d1, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        test.equal(json.bar.name, name1);
        var id = json.bar.id;
        testlib.requests.post('/bars/' + id, d2, function(code, json) {
            test.equal(code, httpStatus.OK);
            test.equal(json.bar.name, name2);
            test.done();
        });
    });
};

exports.testPartialUpdateUneditable = function(test) {
    var d1 = {name: 'test'};
    var d2 = {timestampCreated: '2014-05-11T20:57:18.445Z'};
    testlib.requests.post('/bars', d1, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id = json.bar.id;
        testlib.requests.post('/bars/' + id, d2, function(code, json) {
            test.equal(code, httpStatus.BAD_REQUEST);
            test.done();
        });
    });
};

exports.testPartialUpdate = function(test) {
    var name1 = 'test';
    var d1 = {name: name1};
    var name2 = 'new test';
    var d2 = {name: name2};
    testlib.requests.post('/bars', d1, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        test.equal(json.bar.name, name1);
        var id = json.bar.id;
        testlib.requests.post('/bars/' + id, d2, function(code, json) {
            test.equal(code, httpStatus.OK);
            test.equal(json.bar.name, name2);
            test.done();
        });
    });
};

exports.testPartialUpdateUneditable = function(test) {
    var d1 = {name: 'test'};
    var d2 = {timestampCreated: '2014-05-11T20:57:18.445Z'};
    testlib.requests.post('/bars', d1, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id = json.bar.id;
        testlib.requests.post('/bars/' + id, d2, function(code, json) {
            test.equal(code, httpStatus.BAD_REQUEST);
            test.done();
        });
    });
};

exports.testUpdate = function(test) {
    var name1 = 'test';
    var d1 = {name: name1};
    var name2 = 'new test';
    var d2 = {name: name2};
    testlib.requests.post('/bars', d1, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        test.equal(json.bar.name, name1);
        var id = json.bar.id;
        testlib.requests.put('/bars/' + id, d2, function(code, json) {
            test.equal(code, httpStatus.OK);
            test.equal(json.bar.name, name2);
            test.done();
        });
    });
};

exports.testUpdateMissingField = function(test) {
    var d1 = {name: 'test'};
    var d2 = {};
    testlib.requests.post('/bars', d1, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id = json.bar.id;
        testlib.requests.put('/bars/' + id, d2, function(code, json) {
            test.equal(code, httpStatus.BAD_REQUEST);
            test.done();
        });
    });
};
