var _ = require('underscore');
var errors = require('restberry-errors');
var utils = require('restberry-utils');


module.exports = function(restberry) {
    restberry.model('Team')
        .schema({
            organization: {
                type: restberry.odm.ObjectId,
                ref: 'Organization',
                required: true,
            },
            name: {type: String, required: true},
            createdBy: {
                type: restberry.odm.ObjectId,
                ref: 'User',
                required: true,
            },
            members: [{
                type: restberry.odm.ObjectId,
                ref: 'User',
                uneditable: true,
            }],
            timestampUpdated: {type: Date, default: Date.now, uneditable: true},
            timestampCreated: {type: Date, default: Date.now, uneditable: true},
        })

        .methods({
            isUserAMember: function(userId) {
                var members = _.map(this.members, function(id) {
                    return id.toString();
                });
                return _.contains(members, userId.toString());
            },
        })
        .statics({
            addMemebers: function(req, res, next) {
                var Team = restberry.model('Team');
                var Org = restberry.model('Organization');
                var User = restberry.model('User');
                var onError = Team.onError;
                var userIds = req.body.userIds;
                if (!userIds) {
                    var err = {message: 'Missing user ids'};
                    restberry.onError(errors.BadRequest, err);
                    return;
                }
                var getTeamAndOrg = function(next) {
                    var teamId = req.params.id;
                    Team.findById(teamId, function(team) {
                        var orgId = team.organization;
                        Org.findById(orgId, function(org) {
                            next(team, org);
                        });
                    });
                }
                getTeamAndOrg(function(team, org) {
                    utils.forEachAndDone(userIds, function(userId, iter) {
                        if (!org.isUserAMember(userId)) {
                            var err = {
                                message: 'User needs to be member of the ' +
                                         'organization to be member of a team.',
                            };
                            restberry.onError(errors.BadRequest, err);
                            return;
                        }
                        if (team.isUserAMember(userId)) {
                            var err = {message: 'User is already a member'};
                            restberry.onError(errors.BadRequest, err);
                            return;
                        }
                        User.findById(userId, function(user) {
                            team.members.push(userId);
                            iter();
                        });
                    }, function() {
                        team.save(function(team) {
                            team.expandJSON();
                            team.toJSON(next);
                        });
                    });
                });
            },
        })

        .preRemove(function(next) {
            var Script = restberry.model('Script');
            var query = {team: this.id};
            Script.find(query, function(scripts) {
                utils.forEachAndDone(scripts, function(script, iter) {
                    script.remove(iter);
                }, next);
            });
        })

        .loginRequired()
        .isAuthorized(function(next) {
            var user = restberry.waf.getUser();
            next(this.isUserAMember(user.id));
        })

        .routes
            .addDeleteRoute()
            .addReadRoute()
            .addReadManyRoute({
                parentModel: restberry.model('Organization'),
                preAction: function(req, res, next) {
                    req._query = {
                        organization: req.params.id,
                        members: req.user.id
                    };
                    next();
                },
            })
            .addCreateRoute({
                parentModel: restberry.model('Organization'),
                preAction: function(req, res, next) {
                    var userId = req.user.id;
                    req.body.createdBy = userId;
                    req.body.members = [userId];
                    next();
                },
            })
            .addPartialUpdateRoute({
                actions: {
                    'add-members': restberry.model('Team').addMemebers,
                },
            });

};
