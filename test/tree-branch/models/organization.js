var _ = require('underscore');
var errors = require('restberry-errors');
var utils = require('restberry-utils');


module.exports = function(restberry) {
    restberry.model('Organization')
        .schema({
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
                var members = _.map(this.get('members'), function(id) {
                    return id.toString();
                });
                return _.contains(members, userId.toString());
            },
        })
        .statics({
            addMembers: function(req, res, next) {
                var onError = restberry.waf.handleRes;
                var userIds = req.body.userIds;
                if (!userIds) {
                    var err = {message: 'Missing user ids'};
                    restberry.onError(errors.BadRequest, err);
                    return;
                }
                var Org = restberry.model('Organization');
                var User = restberry.model('User');
                Org.findById(req.params.id, function(org) {
                    utils.forEachAndDone(userIds, function(userId, iter) {
                        if (org.isUserAMember(userId)) {
                            var err = {message: 'User is already a member'};
                            restberry.onError(errors.BadRequest, err);
                            return;
                        }
                        User.findById(userId, function(user) {
                            org.get('members').push(userId);
                            iter();
                        });
                    }, function() {
                        org.save(function(org) {
                            org.options().addExpand('organization');
                            org.toJSON(next);
                        });
                    });
                });
            },
        })

        .preRemove(function(next) {
            var Team = restberry.model('Team');
            var query = {organization: this.getId()}
            Team.find(query, function(teams) {
                utils.forEachAndDone(teams, function(team, iter) {
                    team.remove(iter);
                }, next);
            });
        })

        .loginRequired()
        .isAuthorized(function(next) {
            var user = restberry.waf.getUser();
            next(this.isUserAMember(user.getId()));
        })

        .routes
            .addDeleteRoute()
            .addReadRoute()
            .addReadManyRoute({
                preAction: function(req, res, next) {
                    req._query = {members: req.user.getId()};
                    next();
                },
            })
            .addCreateRoute({
                preAction: function(req, res, next) {
                    var userId = req.user.getId();
                    req.body.createdBy = userId;
                    req.body.members = [userId];
                    next();
                },
            })
            .addPartialUpdateRoute({
                actions: {
                    'add-members': restberry.model('Organization').addMembers,
                },
            })
};
