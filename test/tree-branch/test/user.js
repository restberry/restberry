var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require('../libs/testlib');


var EMAIL = 'test@salesbranch.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testGetMe = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var path = 'users?action=me';
        testlib.client.get(path, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.user.id, userId);
            test.done();
        });
    });
};

exports.testReadManyExcludeSelfZero = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var path = 'users?action=exclude-self';
        testlib.client.get(path, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.users.length, 0);
            test.done();
        });
    });
};

exports.testReadManyExcludeSelfThree = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function() {
        testlib.createUser('a' + EMAIL, PASSWORD, function() {
            testlib.createUser('b' + EMAIL, PASSWORD, function(userId) {
                var path = 'users?action=exclude-self';
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.users.length, 2);
                    for (var i in json.users) {
                        var user = json.users[i];
                        test.notEqual(user.id, userId);
                    }
                    test.done();
                });
            });
        });
    });
};

exports.testInviteUser = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var path = 'users?action=invite-user';
        var d = {email: 'thematerik@gmail.com'};
        testlib.client.post(path, d, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            test.equal(json.user.email, d.email);
            test.done();
        });
    });
};

exports.testInviteUserToOrg = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createOrg({name: 'My Org'}, function(orgId) {
            var path = 'users?action=invite-user';
            var d = {
                email: 'thematerik@gmail.com',
                organizationId: orgId,
            };
            testlib.client.post(path, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                var newUserId = json.user.id;
                test.equal(json.user.email, d.email);
                var path = 'organizations/' + orgId;
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    var expectedMembers = [userId, newUserId];
                    var members = json.organization.members;
                    test.equal(members.length, 2);
                    _.each(members, function(member) {
                        test.ok(_.contains(expectedMembers, member.id));
                        expectedMembers = _.without(expectedMembers, member.id);
                    });
                    test.equal(expectedMembers.length, 0);
                    test.done();
                });
            });
        });
    });
};

exports.testInviteUserCheckUser = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createOrg({name: 'My Org'}, function(orgId) {
            var path = 'users?action=invite-user';
            var d = {
                email: 'thematerik@gmail.com',
                organizationId: orgId,
            };
            testlib.client.post(path, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                var path = 'users?action=me';
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.user.id, userId);
                    test.done();
                });
            });
        });
    });
};
