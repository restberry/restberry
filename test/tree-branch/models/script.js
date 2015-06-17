var _ = require('underscore');
var errors = require('restberry-errors');
var utils = require('restberry-utils');


var CREATED = 201;
var BRANCH_NAME_SUFFIX = ' Branched';

module.exports = function(restberry) {
    restberry.model('Script')
        .schema({
            team: {
                type: restberry.odm.ObjectId,
                ref: 'Team',
                required: true,
            },
            name: {type: String, required: true},
            text: {type: String},
            versioning: {
                version: {type: Number, required: true},
                branchesTo: [{
                    type: restberry.odm.ObjectId,
                    ref: 'Script',
                }],
                branchesFrom: {
                    type: restberry.odm.ObjectId,
                    ref: 'Script',
                },
            },
            createdBy: {
                type: restberry.odm.ObjectId,
                ref: 'User',
                required: true,
            },
            timestampUpdated: {type: Date, default: Date.now, uneditable: true},
            timestampCreated: {type: Date, default: Date.now, uneditable: true},
        })

        .methods({
            addBranchesTo: function(branchesTo) {
                var bt = this.versioning.branchesTo;
                bt.push(branchesTo.id.toString());
            },

            getBranch: function(user) {
                var self = this;
                return {
                    createdBy: user.id,
                    team: self.team.toString(),
                    name: self.name + BRANCH_NAME_SUFFIX,
                    text: self.text,
                    versioning: {
                        version: self.versioning.version + 1,
                        branchesFrom: self.id.toString(),
                    },
                };
            },
        })
        .statics({
            branch: function(req, res, next) {
                var Script = restberry.model('Script');
                var id = req.params.id;
                Script.findById(id, function(branchesFrom) {
                    var d = branchesFrom.getBranch(req.user);
                    Script.create(d, function(branchesTo) {
                        branchesFrom.addBranchesTo(branchesTo);
                        branchesFrom.save(function() {
                            branchesTo.expandJSON();
                            branchesTo.toJSON(function(json) {
                                res.status(CREATED);
                                next(json);
                            });
                        });
                    });
                });
            },

            onlyMe: function(req, res, next) {
                var Team = restberry.model('Team');
                var Script = restberry.model('Script');
                var query = {
                    team: req.params.id,
                    createdBy: req.user.id,
                };
                Script.find(query, function(scripts) {
                    scripts.toJSON(function(json) {
                        Script.hrefs(query, function(hrefs) {
                            next(_.extend(hrefs, json));
                        });
                    });
                });
            },
        })

        .preRemove(function(next) {
            var Activity = restberry.model('Activity');
            var query = {script: this.id};
            Activity.find(query, function(activities) {
                utils.forEachAndDone(activities, function(activity, iter) {
                    activity.remove(iter);
                }, next);
            });
        })
        .preSave(function(next) {
            var self = this;
            var d = {
                team: self.team.toString(),
                user: self.createdBy.toString(),
                script: self.id,
            };
            var Activity = restberry.model('Activity');
            Activity.find(d, function(activities) {
                var types = _.pluck(activities, 'type');
                var branchType = Activity.ACTIVITY_TYPE_BRANCHED;
                var hasBranched = _.contains(types, branchType);
                if (self.versioning.branchesFrom && !hasBranched) {
                    d.type = Activity.ACTIVITY_TYPE_BRANCHED;
                } else if (!activities.length) {
                    d.type = Activity.ACTIVITY_TYPE_CREATED;
                } else {
                    d.type = Activity.ACTIVITY_TYPE_UPDATED;
                }
                Activity.getOrCreate(d, function() {
                    next();
                });
            });
        })

        .loginRequired()
        .isAuthorized(function(next) {
            var Team = restberry.model('Team');
            Team.findById(this.team, function(team) {
                team.isAuthorized(next);
            });
        })

        .routes
            .addReadRoute()
            .addReadManyRoute({
                preAction: function(req, res, next) {
                    req._query = {createdBy: req.user.id};
                    next();
                },
            })
            .addReadManyRoute({
                actions: {
                    'only-me': restberry.model('Script').onlyMe,
                },
                parentModel: restberry.model('Team'),
            })
            .addCreateRoute({
                parentModel: restberry.model('Team'),
                preAction: function(req, res, next) {
                    var Script = restberry.model('Script');
                    var onError = Script.onError;
                    var teamId = req.params.id;
                    Script.find({team: teamId}, function(objs) {
                        if (objs.length) {
                            var err = {
                                message: 'You cannot create more than one ' +
                                         'original script, instead branch ' +
                                         'another script.',
                            };
                            restberry.onError(errors.BadRequest, err);
                        } else {
                            req.body.createdBy = req.user.id;
                            req.body.versioning = {
                                version: 1,
                            };
                            next();
                        }
                    });
                },
            })
            .addPartialUpdateRoute({
                actions: {
                    branch: restberry.model('Script').branch,
                },
            });
};
