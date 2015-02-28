var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');


exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    var d = {name: 'test'};
    testlib.client.post('bars', d, function(err, res) {
        test.equal(res.statusCode, httpStatus.CREATED);
        test.done();
    });
};

exports.testCreateConflict = function(test) {
    var d = {name: 'test'};
    testlib.client.post('bars', d, function(err, res) {
        test.equal(res.statusCode, httpStatus.CREATED);
        testlib.client.post('bars', d, function(err, res) {
            test.equal(res.statusCode, httpStatus.CONFLICT);
            test.done();
        });
    });
};

exports.testReadMany = function(test) {
    testlib.client.get('bars', function(err, res, json) {
        test.equal(res.statusCode, httpStatus.OK);
        test.equal(json.bars.length, 0);
        var d = {name: 'test'};
        testlib.client.post('bars', d, function(err, res) {
            test.equal(res.statusCode, httpStatus.CREATED);
            testlib.client.get('bars', function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.bars.length, 1);
                test.done();
            });
        });
    });
};

exports.testDelete = function(test) {
    var d = {name: 'test'};
    testlib.client.post('bars', d, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id = json.bar.id;
        testlib.client.del('bars/' + id, function(err, res) {
            test.equal(res.statusCode, httpStatus.NO_CONTENT);
            testlib.client.get('bars', function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
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
    testlib.client.post('bars', d1, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        test.equal(json.bar.name, name1);
        var id = json.bar.id;
        testlib.client.post('bars/' + id, d2, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.bar.name, name2);
            test.done();
        });
    });
};

exports.testPartialUpdateUneditable = function(test) {
    var d1 = {name: 'test'};
    var d2 = {timestampCreated: '2014-05-11T20:57:18.445Z'};
    testlib.client.post('bars', d1, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id = json.bar.id;
        testlib.client.post('bars/' + id, d2, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.BAD_REQUEST);
            test.done();
        });
    });
};

exports.testPartialUpdate = function(test) {
    var name1 = 'test';
    var d1 = {name: name1};
    var name2 = 'new test';
    var d2 = {name: name2};
    testlib.client.post('bars', d1, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        test.equal(json.bar.name, name1);
        var id = json.bar.id;
        testlib.client.post('bars/' + id, d2, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.bar.name, name2);
            test.done();
        });
    });
};

exports.testPartialUpdateUneditable = function(test) {
    var d1 = {name: 'test'};
    var d2 = {timestampCreated: '2014-05-11T20:57:18.445Z'};
    testlib.client.post('bars', d1, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id = json.bar.id;
        testlib.client.post('bars/' + id, d2, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.BAD_REQUEST);
            test.done();
        });
    });
};

exports.testUpdate = function(test) {
    var name1 = 'test';
    var d1 = {name: name1};
    var name2 = 'new test';
    var d2 = {name: name2};
    testlib.client.post('bars', d1, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        test.equal(json.bar.name, name1);
        var id = json.bar.id;
        testlib.client.put('bars/' + id, d2, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.bar.name, name2);
            test.done();
        });
    });
};

exports.testUpdateMissingField = function(test) {
    var d1 = {name: 'test'};
    var d2 = {};
    testlib.client.post('bars', d1, function(err, res, json) {
        test.equal(res.statusCode, httpStatus.CREATED);
        var id = json.bar.id;
        testlib.client.put('bars/' + id, d2, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.BAD_REQUEST);
            test.done();
        });
    });
};
