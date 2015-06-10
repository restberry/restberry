var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require('../libs/testlib');


var EMAIL = 'test@salesbranch.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createOrg({
            name: 'My Org',
        }, function(orgId) {
            var path = 'organizations/' + orgId + '/teams';
            testlib.client.post(path, {
                name: 'My Team',
            }, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                test.equal(json.team.createdBy.id, userId);
                test.equal(json.team.members.length, 1);
                test.equal(json.team.members[0].id, userId);
                test.done();
            });
        });
    });
};

exports.testCreateExpand = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createOrg({
            name: 'My Org',
        }, function(orgId) {
            var qs = '?expand=members';
            var path = 'organizations/' + orgId + '/teams' + qs;
            testlib.client.post(path, {
                name: 'My Team',
            }, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                test.equal(json.team.members.length, 1);
                test.equal(json.team.members[0].id, userId);
                test.equal(json.team.members[0].email, EMAIL);
                test.done();
            });
        });
    });
};

exports.testReadMany = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createOrg({
            name: 'My Org',
        }, function(orgId) {
            var d = {name: 'team1'};
            testlib.createTeamOfOrg(orgId, d, function(teamId1) {
                var d = {name: 'team2'};
                testlib.createTeamOfOrg(orgId, d, function(teamId2) {
                    var path = 'organizations/' + orgId + '/teams';
                    testlib.client.get(path, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        test.equal(json.teams.length, 2);
                        test.done();
                    });
                });
            });
        });
    });
};

exports.testReadManyDifferentUsers = function(test) {
    var orgId;
    var teamIds = [];
    var loginAsOldUser = function() {
        testlib.loginUser(EMAIL, PASSWORD, function(userId) {
            var path = 'organizations/' + orgId + '/teams';
            testlib.client.get(path, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.teams.length, 2);
                for (var i in json.teams) {
                    var team = json.teams[i];
                    test.ok(_.contains(teamIds, team.id));
                }
                test.done();
            });
        });
    };
    var loginAsNewUser = function() {
        testlib.createUser('x' + EMAIL, PASSWORD, function(userId) {
            var d = {name: 'team3'};
            testlib.createTeam(d, function(teamId3) {
                loginAsOldUser();
            });
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createOrg({
            name: 'My Org',
        }, function(_orgId) {
            orgId = _orgId;
            var d = {name: 'team1'};
            testlib.createTeamOfOrg(orgId, d, function(teamId1) {
                var d = {name: 'team2'};
                testlib.createTeamOfOrg(orgId, d, function(teamId2) {
                    teamIds = [teamId1, teamId2];
                    loginAsNewUser();
                });
            });
        });
    });
};

exports.testAddTheSameMember = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'My team'};
        testlib.createTeam(d, function(teamId) {
            var qs = '?action=add-members';
            var d = {userIds: [userId]};
            var path = 'teams/' + teamId;
            testlib.client.post(path + qs, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.BAD_REQUEST);
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.team.members.length, 1);
                    test.done();
                });
            });
        });
    });
};

exports.testAddMemberNotInOrg = function(test) {
    testlib.createUser('x' + EMAIL, PASSWORD, function(otherUserId) {
        testlib.createUser(EMAIL, PASSWORD, function(userId) {
            var d = {name: 'My Team'};
            testlib.createTeam(d, function(teamId) {
                var qs = '?action=add-members';
                var d = {userIds: [otherUserId]};
                var path = 'teams/' + teamId + qs;
                testlib.client.post(path, d, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.BAD_REQUEST);
                    test.done();
                });
            });
        });
    });
};

exports.testAddMember = function(test) {
    testlib.createUser('x' + EMAIL, PASSWORD, function(otherUserId) {
        testlib.createUser(EMAIL, PASSWORD, function(userId) {
            testlib.createOrg({
                name: 'My Org',
            }, function(orgId) {
                var qs = '?action=add-members';
                var d = {userIds: [otherUserId]};
                var path = 'organizations/' + orgId + qs;
                testlib.client.post(path, d, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.organization.members.length, 2);
                    var d = {name: 'My Team'};
                    testlib.createTeamOfOrg(orgId, d, function(teamId) {
                        var d = {userIds: [otherUserId]};
                        var path = 'teams/' + teamId + qs;
                        testlib.client.post(path, d, function(err, res, json) {
                            test.equal(res.statusCode, httpStatus.OK);
                            test.equal(json.team.members.length, 2);
                            test.done();
                        });
                    });
                });
            });
        });
    });
};

exports.testAddMembersNotInOrg = function(test) {
    testlib.createUser('x' + EMAIL, PASSWORD, function(otherUserId1) {
        testlib.createUser('y' + EMAIL, PASSWORD, function(otherUserId2) {
            testlib.createUser(EMAIL, PASSWORD, function(userId) {
                var d = {name: 'My Team'};
                testlib.createTeam(d, function(teamId) {
                    var qs = '?action=add-members';
                    var d = {userIds: [otherUserId1, otherUserId2]};
                    var path = 'teams/' + teamId + qs;
                    testlib.client.post(path, d, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.BAD_REQUEST);
                        test.done();
                    });
                });
            });
        });
    });
};

exports.testAddMembers = function(test) {
    var qs = '?action=add-members';
    var addMembersToOrg = function(d, next) {
        testlib.createOrg({
            name: 'My Org',
        }, function(orgId) {
            var path = 'organizations/' + orgId + qs;
            testlib.client.post(path, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.organization.members.length, 3);
                next(orgId);
            });
        });
    };
    testlib.createUser('x' + EMAIL, PASSWORD, function(otherUserId1) {
        testlib.createUser('y' + EMAIL, PASSWORD, function(otherUserId2) {
            testlib.createUser(EMAIL, PASSWORD, function(userId) {
                var d = {userIds: [otherUserId1, otherUserId2]};
                addMembersToOrg(d, function(orgId) {
                    var x = {name: 'My Team'}
                    testlib.createTeamOfOrg(orgId, x, function(teamId) {
                        var path = 'teams/' + teamId + qs;
                        testlib.client.post(path, d, function(err, res, json) {
                            test.equal(res.statusCode, httpStatus.OK);
                            test.equal(json.team.members.length, 3);
                            test.done();
                        });
                    });
                });
            });
        });
    });
};

exports.testUnauthReadNotOrgMember = function(test) {
    var loginAsNewUser = function(teamId) {
        testlib.createUser('x' + EMAIL, PASSWORD, function(userId) {
            var path = 'teams/' + teamId;
            testlib.client.get(path, function(err, res) {
                test.equal(res.statusCode, httpStatus.FORBIDDEN);
                test.done();
            });
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'My Team'}
        testlib.createTeam(d, function(teamId) {
            testlib.logoutUser(function() {
                loginAsNewUser(teamId);
            });
        });
    });
};

exports.testUnauthReadOrgMember = function(test) {
    var orgId;
    var loginAsNewUser = function(teamId) {
        testlib.createUser('x' + EMAIL, PASSWORD, function(userId) {
            testlib.addMembersToOrg(orgId, [userId], function() {
                var path = 'teams/' + teamId;
                testlib.client.get(path, function(err, res) {
                    test.equal(res.statusCode, httpStatus.FORBIDDEN);
                    test.done();
                });
            });
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'My Team'}
        testlib.createOrg(d, function(_orgId) {
            orgId = _orgId;
            testlib.createTeamOfOrg(orgId, d, function(teamId) {
                testlib.logoutUser(function() {
                    loginAsNewUser(teamId);
                });
            });
        });
    });
};

exports.testAuthRead = function(test) {
    var xEmail = 'x' + EMAIL;
    var loginAsNewUser = function(teamId) {
        testlib.loginUser(xEmail, PASSWORD, function(userId) {
            var path = 'teams/' + teamId;
            testlib.client.get(path, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.team.members.length, 2);
                test.done();
            });
        });
    };
    testlib.createUser(xEmail, PASSWORD, function(otherUserId) {
        testlib.createUser(EMAIL, PASSWORD, function(userId) {
            var d = {name: 'My Team'}
            testlib.createTeam(d, function(teamId) {
                testlib.addMembersToTeam(teamId, [otherUserId], function() {
                    testlib.logoutUser(function() {
                        loginAsNewUser(teamId);
                    });
                });
            });
        });
    });
};

exports.testDelete = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'My Team'}
        testlib.createTeam(d, function(teamId) {
            var path = 'teams/' + teamId;
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
