var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require('../libs/testlib');


var EMAIL = 'test@salesbranch.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testReadMany = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var path = 'teams/' + teamId + '/activities';
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.activities.length, 1);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyExpand = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var qs = '?expand=activity';
                var path = 'teams/' + teamId + '/activities';
                testlib.client.get(path + qs, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.activities.length, 1);
                    for (var i in json.activities) {
                        var activity = json.activities[i];
                        test.ok(activity.user)
                        test.ok(activity.activity)
                    }
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyFields = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var qs = '?expand=activity,team&fields=team,name';
                var path = 'teams/' + teamId + '/activities';
                testlib.client.get(path + qs, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.activities.length, 1);
                    var activity = json.activities[0];
                    test.ok(activity.team.name)
                    test.ok(!activity.team.createdBy)
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyBranched = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var qs = '?action=branch';
                var path = 'scripts/' + scriptId;
                testlib.client.post(path + qs, {}, function(err, res) {
                    test.equal(res.statusCode, httpStatus.CREATED);
                    var qs = '?expand=activity';
                    var path = 'teams/' + teamId + '/activities';
                    testlib.client.get(path + qs, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        test.equal(json.activities.length, 3);
                        var types = ['CREATED', 'BRANCHED', 'UPDATED'];
                        for (var i in json.activities) {
                            var activity = json.activities[i];
                            test.ok(_.contains(types, activity.type));
                            var type = activity.type.toLowerCase();
                            test.ok(activity.activity.indexOf(type) > -1);
                            types = _.without(types, activity.type);
                        }
                        test.done();
                    });
                });
            });
        });
    });
};

exports.testReadManyUpdated = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var path = 'scripts/' + scriptId;
                testlib.client.post(path, d, function(err, res) {
                    test.equal(res.statusCode, httpStatus.OK);
                    var qs = '?expand=activity';
                    var path = 'teams/' + teamId + '/activities';
                    testlib.client.get(path + qs, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        test.equal(json.activities.length, 2);
                        var types = ['CREATED', 'UPDATED'];
                        for (var i in json.activities) {
                            var activity = json.activities[i];
                            test.ok(_.contains(types, activity.type));
                            var type = activity.type.toLowerCase();
                            test.ok(activity.activity.indexOf(type) > -1);
                            types = _.without(types, activity.type);
                        }
                        test.done();
                    });
                });
            });
        });
    });
};
