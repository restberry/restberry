var _ = require('underscore');
var httpStatus = require('http-status');
var testlib = require(process.env.NODE_PATH + '/testlib');

exports = _.defaults(exports, testlib);

exports.createOrg = function(d, next) {
    var path = 'organizations';
    testlib.client.post(path, d, function(err, res, json) {
        if (res.statusCode === httpStatus.CREATED)  next(json.organization.id);
    });
};

exports.createTeam = function(d, next) {
    var self = this;
    self.createOrg({name: 'My Org'}, function(orgId) {
        self.createTeamOfOrg(orgId, d, next);
    });
};

exports.createTeamOfOrg = function(orgId, d, next) {
    var path = 'organizations/' + orgId + '/teams';
    testlib.client.post(path, d, function(err, res, json) {
        if (res.statusCode === httpStatus.CREATED)  next(json.team.id);
    });
};

exports.addMembersToOrg = function(orgId, userIds, next) {
    var d = userIds;
    if (!d.userIds)  d = {userIds: d};
    var qs = '?action=add-members';
    var path = 'organizations/' + orgId + qs;
    testlib.client.post(path, d, function(err, res, json) {
        if (res.statusCode !== httpStatus.OK)  return;
        next();
    });
};

exports.addMembersToTeam = function(teamId, userIds, next) {
    var self = this;
    var d = userIds;
    if (!d.userIds)  d = {userIds: d};
    var qs = '?action=add-members';
    var path = 'teams/' + teamId;
    testlib.client.get(path, function(err, res, json) {
        if (res.statusCode !== httpStatus.OK)  return;
        var orgId = json.team.organization.id;
        self.addMembersToOrg(orgId, d, function() {
            var path = 'teams/' + teamId + qs;
            testlib.client.post(path, d, function(err, res, json) {
                if (res.statusCode !== httpStatus.OK)  return;
                next();
            });
        });
    });
};

exports.createScript = function(d, next) {
    var self = this;
    self.createTeam({name: 'My Team'}, function(teamId) {
        self.createScriptOfTeam(teamId, d, next);
    });
};

exports.createScriptOfTeam = function(teamId, d, next) {
    var path = 'teams/' + teamId + '/scripts';
    testlib.client.post(path, d, function(err, res, json) {
        if (res.statusCode === httpStatus.CREATED)  next(json.script.id);
    });
};

exports.createUser = function(email, password, next) {
    testlib.client.post('users', {
        email: email,
        password: password,
    }, function(err, res, json) {
        if (res.statusCode === httpStatus.CREATED) {
            testlib.session.start(res);
            exports.client = testlib.client;
            next(json.user.id);
        }
    });
};

exports.loginUser = function(username, password, next) {
    testlib.client.post('login', {
        email: username,
        password: password,
    }, function(err, res, json) {
        if (res.statusCode === httpStatus.OK) {
            testlib.session.start(res);
            exports.client = testlib.client;
            next(json.user.id);
        }
    });
};

exports.logoutUser = function(next) {
    testlib.client.get('logout', function(err, res) {
        testlib.session.end();
        if (res.statusCode === httpStatus.NO_CONTENT)  next();
    });
};
