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
var TEST_DATA_2 = {
    requester: 'Developer',
    requestee: 'Graphic Designer',
    project: 'iOS Game',
    location: {
        city: 'Stockholm',
        country: 'Sweden',
    },
};

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    testlib.login(function(userId) {
        testlib.client.post('collabs', TEST_DATA_1, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            test.equal(json.collab.requester, TEST_DATA_1.requester);
            test.done();
        });
    });
};

exports.testReadMany = function(test) {
    testlib.login(function(userId) {
        var d = TEST_DATA_1;
        testlib.createCollab(d, function(collabId1) {
            testlib.createCollab(d, function(collabId2) {
                testlib.client.get('collabs', function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.collabs.length, 2);
                    test.done();
                });
            });
        });
    });
};

exports.testFilter = function(test) {
    testlib.login(function(userId) {
        var d = TEST_DATA_1;
        testlib.createCollab(d, function(collabId1) {
            testlib.createCollab(d, function(collabId2) {
                var dummyUserId = '53f38a9a649bba72169abf38';
                var qs = '?action=filter&user=' + dummyUserId;
                var path = 'collabs';
                testlib.client.get(path + qs, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.collabs.length, 0);
                    test.done();
                });
            });
        });
    });
};

exports.testFilterMe = function(test) {
    testlib.login(function(userId) {
        var d = TEST_DATA_1;
        testlib.createCollab(d, function(collabId1) {
            testlib.createCollab(d, function(collabId2) {
                testlib.login(function(userId) {
                    testlib.createCollab(d, function(collabId3) {
                        var qs = '?action=filter&expand=collab&fields=user';
                        qs += '&user=' + userId;
                        var path = 'collabs';
                        testlib.client.get(path + qs, function(err, res, json) {
                            test.equal(res.statusCode, httpStatus.OK);
                            test.equal(json.collabs.length, 1);
                            _.each(json.collabs, function(collab) {
                                test.equal(collab.user.id, userId);
                            });
                            test.done();
                        });
                    });
                }, 1);
            });
        });
    });
};

exports.testFilterOtherUser = function(test) {
    testlib.login(function(userId) {
        var d = TEST_DATA_1;
        testlib.createCollab(d, function(collabId1) {
            testlib.createCollab(d, function(collabId2) {
                testlib.login(function() {
                    testlib.createCollab(d, function(collabId3) {
                        var qs = '?action=filter&expand=collab&fields=user';
                        var path = 'collabs';
                        testlib.client.get(path + qs, function(err, res, json) {
                            test.equal(res.statusCode, httpStatus.OK);
                            test.equal(json.collabs.length, 3);
                            test.done();
                        });
                    });
                }, 1);
            });
        });
    });
};

exports.testFilterCollaber = function(test) {
    testlib.login(function(userId) {
        var d = TEST_DATA_1;
        testlib.createCollab(d, function(collabId1) {
            var d = TEST_DATA_2;
            testlib.createCollab(d, function(collabId2) {
                var requester = TEST_DATA_1.requester;
                var qs = '?action=filter&expand=collab'
                qs += '&user=' + userId + '&requester=' + requester;
                var path = 'collabs';
                testlib.client.get(path + qs, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.collabs.length, 2);
                    test.done();
                });
            });
        });
    });
};

exports.testFilterCollabee = function(test) {
    testlib.login(function(userId) {
        var d = TEST_DATA_1;
        testlib.createCollab(d, function(collabId1) {
            var d = TEST_DATA_2;
            testlib.createCollab(d, function(collabId2) {
                var requestee = TEST_DATA_1.requestee;
                var qs = '?action=filter&expand=collab'
                qs += '&user=' + userId + '&requestee=' + requestee;
                var path = 'collabs';
                testlib.client.get(path + qs, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.collabs.length, 1);
                    var collab = json.collabs.pop();
                    test.equal(collab.id, collabId1);
                    test.done();
                });
            });
        });
    });
};

exports.testFilterLocation = function(test) {
    testlib.login(function(userId) {
        var d = TEST_DATA_1;
        testlib.createCollab(d, function(collabId1) {
            var d = TEST_DATA_2;
            testlib.createCollab(d, function(collabId2) {
                var city = TEST_DATA_1.location.city;
                var country = TEST_DATA_1.location.country;
                var location = city + ',%20' + country;
                var qs = '?action=filter&expand=collab';
                qs += '&user=' + userId + '&location=' + location;
                var path = 'collabs';
                testlib.client.get(path + qs, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.collabs.length, 1);
                    var collab = json.collabs.pop();
                    test.equal(collab.id, collabId1);
                    test.done();
                });
            });
        });
    });
};
