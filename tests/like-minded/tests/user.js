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

exports.testGetMe = function(test) {
    testlib.login(function(userId) {
        var qs = '?action=me';
        var path = 'users';
        testlib.client.get(path + qs, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.user.id, userId);
            test.equal(json.user.nbrOfCollabs, 0);
            test.done();
        });
    });
};

exports.testGetMeOneCollab = function(test) {
    testlib.login(function(userId) {
        testlib.createCollab(TEST_DATA_1, function(collabId) {
            var qs = '?action=me';
            var path = 'users';
            testlib.client.get(path + qs, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.user.id, userId);
                test.equal(json.user.nbrOfCollabs, 1);
                test.done();
            });
        });
    });
};
