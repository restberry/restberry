var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require('../libs/testlib');

var TEST_DATA_1 = {
    requester: 'Developer',
    requestee: 'Designer',
    project: 'Web App',
    location: {
        city: 'Gothenburg',
        country: 'Sweden',
    },
};

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testConnectToSelf = function(test) {
    testlib.login(function(userId) {
        testlib.createCollab(TEST_DATA_1, function(collabId) {
            var qs = '?expand=collab&action=connect';
            var path = 'collabs/' + collabId;
            testlib.client.post(path + qs, {}, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.BAD_REQUEST);
                test.done();
            });
        });
    });
};

exports.testConnect = function(test) {
    testlib.login(function(userId) {
        testlib.createCollab(TEST_DATA_1, function(collabId) {
            testlib.login(function(userId) {
                var qs = '?expand=collab&action=connect';
                var path = 'collabs/' + collabId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.collab.connections.length, 1);
                    test.done();
                });
            }, 1);
        });
    });
};

exports.testConnectTwice = function(test) {
    testlib.login(function(userId) {
        testlib.createCollab(TEST_DATA_1, function(collabId) {
            testlib.login(function(userId) {
                var qs = '?expand=collab&action=connect';
                var path = 'collabs/' + collabId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    testlib.client.post(path + qs, {}, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.BAD_REQUEST);
                        test.done();
                    });
                });
            }, 1);
        });
    });
};

exports.testConnectExpandConnections = function(test) {
    testlib.login(function(userId) {
        testlib.createCollab(TEST_DATA_1, function(collabId) {
            testlib.login(function(userId) {
                var qs = '?expand=collab,connection&action=connect';
                var path = 'collabs/' + collabId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.collab.connections.length, 1);
                    test.done();
                });
            }, 1);
        });
    });
};

exports.testConnectReadMany = function(test) {
    testlib.login(function(userId) {
        testlib.createCollab(TEST_DATA_1, function(collabId) {
            testlib.login(function(userId) {
                var qs = '?expand=collab,connection&action=connect';
                var path = 'collabs/' + collabId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    var qs = '?expand=collab';
                    var path = 'collabs';
                    testlib.client.get(path + qs, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        test.equal(json.collabs.length, 1);
                        var collab = json.collabs.pop();
                        test.equal(collab.connections.length, 1)
                        test.done();
                    });
                });
            }, 1);
        });
    });
};
