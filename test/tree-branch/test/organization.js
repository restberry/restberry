var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require('../libs/testlib');


var EMAIL = 'test@salesbranch.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.client.post('organizations', {
            name: 'My organization',
        }, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            test.equal(json.organization.members.length, 1);
            test.equal(json.organization.members[0].id, userId);
            test.done();
        });
    });
};

exports.testCreateExpand = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.client.post('organizations?expand=members', {
            name: 'My organization',
        }, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.CREATED);
            test.equal(json.organization.members.length, 1);
            test.equal(json.organization.members[0].id, userId);
            test.equal(json.organization.members[0].email, EMAIL);
            test.done();
        });
    });
};

exports.testReadMany = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'organization1'};
        testlib.createOrg(d, function(orgId1) {
            var d = {name: 'organization2'};
            testlib.createOrg(d, function(orgId2) {
                testlib.client.get('organizations', function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.organizations.length, 2);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyDifferentUsers = function(test) {
    var orgIds = [];
    var loginAsOldUser = function() {
        testlib.loginUser(EMAIL, PASSWORD, function(userId) {
            testlib.client.get('organizations', function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.organizations.length, 2);
                for (var i in json.organizations) {
                    var organization = json.organizations[i];
                    test.ok(_.contains(orgIds, organization.id));
                }
                test.done();
            });
        });
    };
    var loginAsNewUser = function() {
        testlib.createUser('x' + EMAIL, PASSWORD, function(userId) {
            var d = {name: 'organization3'};
            testlib.createOrg(d, function(orgId3) {
                testlib.client.get('organizations', function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.organizations.length, 1);
                    var ids = _.pluck(json.organizations, 'id');
                    test.ok(_.contains(ids, orgId3));
                    loginAsOldUser();
                });
            });
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.client.get('organizations', function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.organizations.length, 0);
            var d = {name: 'organization1'};
            testlib.createOrg(d, function(orgId1) {
                var d = {name: 'organization2'};
                testlib.createOrg(d, function(orgId2) {
                    orgIds = [orgId1, orgId2];
                    loginAsNewUser();
                });
            });
        });
    });
};

exports.testAddMember = function(test) {
    testlib.createUser('x' + EMAIL, PASSWORD, function(otherUserId) {
        testlib.createUser(EMAIL, PASSWORD, function(userId) {
            var d = {name: 'My organization'};
            testlib.createOrg(d, function(orgId) {
                var qs = '?action=add-members';
                var d = {userIds: [otherUserId]};
                var path = 'organizations/' + orgId + qs;
                testlib.client.post(path, d, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.organization.members.length, 2);
                    test.done();
                });
            });
        });
    });
};

exports.testAddMembers = function(test) {
    testlib.createUser('x' + EMAIL, PASSWORD, function(otherUserId1) {
        testlib.createUser('y' + EMAIL, PASSWORD, function(otherUserId2) {
            testlib.createUser(EMAIL, PASSWORD, function(userId) {
                var d = {name: 'My organization'};
                testlib.createOrg(d, function(orgId) {
                    var qs = '?action=add-members';
                    var d = {userIds: [otherUserId1, otherUserId2]};
                    var path = 'organizations/' + orgId + qs;
                    testlib.client.post(path, d, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        test.equal(json.organization.members.length, 3);
                        test.done();
                    });
                });
            });
        });
    });
};

exports.testAddTheSameMember = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'My organization'};
        testlib.createOrg(d, function(orgId) {
            var qs = '?action=add-members';
            var d = {userIds: [userId]};
            var path = 'organizations/' + orgId;
            testlib.client.post(path + qs, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.BAD_REQUEST);
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.organization.members.length, 1);
                    test.done();
                });
            });
        });
    });
};

exports.testUnauthRead = function(test) {
    var loginAsNewUser = function(orgId) {
        testlib.createUser('x' + EMAIL, PASSWORD, function(userId) {
            var path = 'organizations/' + orgId;
            testlib.client.get(path, function(err, res) {
                test.equal(res.statusCode, httpStatus.FORBIDDEN);
                test.done();
            });
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'My organization'};
        testlib.createOrg(d, function(orgId) {
            testlib.logoutUser(function() {
                loginAsNewUser(orgId);
            });
        });
    });
};

exports.testAuthRead = function(test) {
    var xEmail = 'x' + EMAIL;
    var loginAsNewUser = function(orgId) {
        testlib.loginUser(xEmail, PASSWORD, function(userId) {
            var path = 'organizations/' + orgId;
            testlib.client.get(path, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.organization.members.length, 2);
                test.done();
            });
        });
    };
    testlib.createUser(xEmail, PASSWORD, function(otherUserId) {
        testlib.createUser(EMAIL, PASSWORD, function(userId) {
            var d = {name: 'My organization'};
            testlib.createOrg(d, function(orgId) {
                var qs = '?action=add-members';
                var d = {userIds: [otherUserId]};
                var path = 'organizations/' + orgId + qs;
                testlib.client.post(path, d, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    testlib.logoutUser(function() {
                        loginAsNewUser(orgId);
                    });
                });
            });
        });
    });
};

exports.testDelete = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'My organization'};
        testlib.createOrg(d, function(orgId) {
            var path = 'organizations/' + orgId;
            testlib.client.del(path, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.NO_CONTENT);
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.NOT_FOUND);
                    test.done();
                });
            });
        });
    });
};
