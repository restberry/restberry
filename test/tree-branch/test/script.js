var _ = require('underscore');
var httpStatus = require('http-status');
var restberry = require('restberry');
var testlib = require('../libs/testlib');
var utils = require('restberry-utils');


var EMAIL = 'test@salesbranch.com';
var PASSWORD = 'asdfasdf';

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var path = 'teams/' + teamId + '/scripts';
            var d = {
                name: 'test',
                text: 'test',
            };
            testlib.client.post(path, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                test.equal(json.script.text, d.text);
                test.done();
            });
        });
    });
};

exports.testCreateMultiple = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var path = 'teams/' + teamId + '/scripts';
            var d = {name: 'test', text: 'test'};
            testlib.client.post(path, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                testlib.client.post(path, d, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.BAD_REQUEST);
                    test.done();
                });
            });
        });
    });
};

exports.testUpdate = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test', text: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var path = 'scripts/' + scriptId;
                var d = {text: 'test again'};
                testlib.client.post(path, d, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.script.text, d.text);
                    test.done();
                });
            });
        });
    });
};

exports.testUpdateUnauth = function(test) {
    var loginWithNewUser = function(scriptId) {
        testlib.createUser('x' + EMAIL, PASSWORD, function() {
            var path = 'scripts/' + scriptId;
            var d = {name: 'test again', text: 'test again'};
            testlib.client.post(path, d, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.FORBIDDEN);
                test.done();
            });
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test', text: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                loginWithNewUser(scriptId);
            });
        });
    });
};

exports.testCreateBranch = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            testlib.createScriptOfTeam(teamId, {
                name: 'test',
                text: 'test',
            }, function(scriptId) {
                var qs = '?action=branch';
                var path = 'scripts/' + scriptId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.CREATED);
                    var versioning = json.script.versioning;
                    test.equal(versioning.version, 2);
                    test.equal(versioning.branchesFrom.id, scriptId);
                    test.deepEqual(versioning.branchesTo, []);
                    var newScriptId = json.script.id;
                    testlib.client.get(path, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        var versioning = json.script.versioning;
                        test.equal(versioning.version, 1);
                        test.equal(versioning.branchesFrom, null);
                        test.equal(versioning.branchesTo.length, 1);
                        var branchesTo = versioning.branchesTo[0];
                        test.equal(branchesTo.id, newScriptId);
                        test.done();
                    });
                });
            });
        });
    });
};

exports.testCreateMultipleBranches = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            testlib.createScriptOfTeam(teamId, {
                name: 'test',
                text: 'test',
            }, function(scriptId) {
                var qs = '?action=branch';
                var path = 'scripts/' + scriptId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.CREATED);
                    testlib.client.post(path + qs, {}, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.CREATED);
                        testlib.client.get(path, function(err, res, json) {
                            test.equal(res.statusCode, httpStatus.OK);
                            var versioning = json.script.versioning;
                            test.equal(versioning.branchesTo.length, 2);
                            test.done();
                        });
                    });
                });
            });
        });
    });
};

exports.testCreateMultipleBranchesExpand = function(test) {
    var expandBranchesTo = function(path) {
        var qs = '?expand=branchesTo,createdBy'
        testlib.client.get(path + qs, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            var versioning = json.script.versioning;
            var bts = versioning.branchesTo;
            test.equal(bts.length, 2);
            for (var i in bts) {
                var bt = bts[i];
                test.equal(bt.createdBy.email, EMAIL);
            }
            test.done();
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            testlib.createScriptOfTeam(teamId, {
                name: 'test',
                text: 'test',
            }, function(scriptId) {
                var qs = '?action=branch';
                var path = 'scripts/' + scriptId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.CREATED);
                    testlib.client.post(path + qs, {}, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.CREATED);
                        expandBranchesTo(path);
                    });
                });
            });
        });
    });
};

exports.testCreateBranchExpandBranchesFrom = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test', text: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var qs = '?action=branch&expand=branchesFrom';
                var path = 'scripts/' + scriptId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.CREATED);
                    var versioning = json.script.versioning;
                    test.equal(versioning.version, 2);
                    var bf = versioning.branchesFrom;
                    test.equal(bf.id, scriptId);
                    test.equal(bf.text, d.text);
                    test.done();
                });
            });
        });
    });
};

exports.testCreateBranchExpandBranchesTo = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test', text: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var qs = '?action=branch';
                var path = 'scripts/' + scriptId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.CREATED);
                    var qs = '?expand=branchesTo';
                    testlib.client.get(path + qs, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        var versioning = json.script.versioning;
                        var bts = versioning.branchesTo;
                        test.equal(bts.length, 1);
                        for (var i in bts) {
                            var bt = bts[i];
                            test.equal(bt.createdBy.id, userId);
                        }
                        test.done();
                    });
                });
            });
        });
    });
};

exports.testCreateBranchExpandBranchesToBrancesFrom = function(test) {
    var _userId;
    var getScriptAndExpand = function(path) {
        var qs = '?expand=branchesTo,branchesFrom';
        testlib.client.get(path + qs, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            var versioning = json.script.versioning;
            var bf = versioning.branchesFrom;
            test.equal(bf.createdBy.id, _userId);
            var bts = versioning.branchesTo;
            test.equal(bts.length, 1);
            for (var i in bts) {
                var bt = bts[i];
                test.equal(bt.createdBy.id, _userId);
            }
            test.done();
        });
    };
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        _userId = userId;
        var d = {name: 'test'};
        testlib.createTeam(d, function(teamId) {
            var d = {name: 'test', text: 'test'};
            testlib.createScriptOfTeam(teamId, d, function(scriptId) {
                var qs = '?action=branch';
                var path = 'scripts/' + scriptId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.CREATED);
                    var scriptId = json.script.id;
                    var path = 'scripts/' + scriptId;
                    testlib.client.post(path + qs, {}, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.CREATED);
                        getScriptAndExpand(path);
                    });
                });
            });
        });
    });
};

exports.testCreateBranchExpandCreatedBy = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test', text: 'test'};
        testlib.createScript(d, function(scriptId) {
            var qs = '?action=branch&expand=branchesFrom,createdBy';
            var path = 'scripts/' + scriptId;
            testlib.client.post(path + qs, {}, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.CREATED);
                var btId = json.script.id;
                var versioning = json.script.versioning;
                var bf = versioning.branchesFrom;
                test.equal(bf.id, scriptId);
                test.equal(bf.createdBy.id, userId);
                test.equal(bf.createdBy.email, EMAIL);
                test.equal(json.script.createdBy.id, userId);
                test.equal(json.script.createdBy.email, EMAIL);
                var qs = '?expand=branchesTo,createdBy';
                var path = 'scripts/' + scriptId;
                testlib.client.get(path + qs, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    var versioning = json.script.versioning;
                    var bts = versioning.branchesTo;
                    test.equal(bts.length, 1);
                    var bt = bts[0];
                    test.equal(bt.id, btId);
                    test.equal(bt.createdBy.id, userId);
                    test.equal(bt.createdBy.email, EMAIL);
                    test.equal(json.script.createdBy.id, userId);
                    test.equal(json.script.createdBy.email, EMAIL);
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyOnlyMe = function(test) {
    var createTeam = function(next) {
        testlib.createUser(EMAIL, PASSWORD, function(userId) {
            testlib.createUser('x' + EMAIL, PASSWORD, function(otherUserId) {
                testlib.createTeam({name: 'My Team'}, function(teamId) {
                    testlib.addMembersToTeam(teamId, [userId], function() {
                        next(teamId);
                    });
                });
            });
        });
    };
    var getScrips = function(teamId, myScriptId, otherScriptId) {
        var path = 'teams/' + teamId + '/scripts';
        testlib.client.get(path, function(err, res, json) {
            test.ok(res.statusCode, httpStatus.OK);
            test.equal(json.scripts.length, 2);
            var qs = '?action=only-me&expand=script';
            testlib.client.get(path + qs, function(err, res, json) {
                test.ok(res.statusCode, httpStatus.OK);
                test.equal(json.scripts.length, 1);
                var s = json.scripts[0];
                test.equal(s.id, myScriptId);
                test.ok(s.name);
                test.done();
            });
        });
    };
    createTeam(function(teamId) {
        var d = {name: 'test', text: 'test'};
        testlib.createScriptOfTeam(teamId, d, function(otherScriptId) {
            testlib.loginUser(EMAIL, PASSWORD, function() {
                var qs = '?action=branch';
                var path = 'scripts/' + otherScriptId;
                testlib.client.post(path + qs, {}, function(err, res, json) {
                    test.ok(res.statusCode, httpStatus.CREATED);
                    var myScriptId = json.script.id;
                    getScrips(teamId, myScriptId, otherScriptId);
                });
            });
        });
    });
};

exports.testReadMyScripts = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createScript({name: 'a'}, function(scriptId) {
            var path = 'scripts';
            testlib.client.get(path, function(err, res, json) {
                test.equal(res.statusCode, httpStatus.OK);
                test.equal(json.scripts.length, 1);
                var ids = _.pluck(json.scripts, 'id');
                test.ok(_.contains(ids, scriptId));
                test.done();
            });
        });
    });
};

exports.testReadManyMyScripts = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createScript({name: 'a'}, function(scriptId1) {
            testlib.createScript({name: 'b'}, function(scriptId2) {
                var scriptIds = [scriptId1, scriptId2];
                var path = 'scripts';
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.scripts.length, 2);
                    _.each(json.scripts, function(script) {
                        test.ok(_.contains(scriptIds, script.id));
                    });
                    test.done();
                });
            });
        });
    });
};

exports.testReadManyMyScriptsFields = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createScript({name: 'a'}, function(scriptId1) {
            testlib.createScript({name: 'b'}, function(scriptId2) {
                var scriptIds = [scriptId1, scriptId2];
                var qs = '?expand=script,branchesTo,createdBy,' +
                         'branchesFrom,team,organization&fields=name';
                var path = 'scripts' + qs;
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.scripts.length, 2);
                    _.each(json.scripts, function(script) {
                        test.ok(_.contains(scriptIds, script.id));
                    });
                    test.done();
                });
            });
        });
    });
};

exports.testReadMyScriptsDifferentUsers = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        testlib.createScript({name: 'a'}, function() {
            testlib.createUser('x' + EMAIL, PASSWORD, function(userId) {
                testlib.createScript({name: 'a'}, function(scriptId) {
                    var path = 'scripts';
                    testlib.client.get(path, function(err, res, json) {
                        test.equal(res.statusCode, httpStatus.OK);
                        test.equal(json.scripts.length, 1);
                        var ids = _.pluck(json.scripts, 'id');
                        test.ok(_.contains(ids, scriptId));
                        test.done();
                    });
                });
            });
        });
    });
};

exports.testCascadeDelete = function(test) {
    testlib.createUser(EMAIL, PASSWORD, function(userId) {
        var path = 'organizations';
        testlib.client.get(path, function(err, res, json) {
            test.equal(res.statusCode, httpStatus.OK);
            var orgs = json.organizations;
            utils.forEachAndDone(orgs, function(org, iter) {
                var path = 'organizations/' + org.id;
                testlib.client.del(path, function(err, res) {
                    test.equal(res.statusCode, httpStatus.NO_CONTENT);
                    iter();
                });
            }, function() {
                var path = 'scripts?expand=script,team';
                testlib.client.get(path, function(err, res, json) {
                    test.equal(res.statusCode, httpStatus.OK);
                    test.equal(json.scripts.length, 0);
                    test.done();
                });
            });
        });
    });
};
