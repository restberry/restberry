var _ = require('underscore');
var utils = require('restberry-utils');


var CONNECTION_FIELDS = [
    'user',
    'approved',
    'timestampApproved',
    'timestampUpdated',
    'timestampCreated',
];
var MODEL_NAME = 'Collab';
var USER_FIELDS = [
    'ids',
    'email',
    'name',
    'image',
    'gender',
    'timestampLastLogIn',
    'timestampUpdated',
    'timestampCreated',
];

module.exports = function(restberry) {

    console.log(restberry.odm.ObjectId)

    restberry.model(MODEL_NAME)
        .schema({
            user: {
                type: restberry.odm.ObjectId,
                ref: 'User',
                required: true,
            },
            requester: {type: String, required: true},
            requestee: {type: String, required: true},
            project: {type: String, required: true},
            location: {
                city: {type: String, default: null},
                country: {type: String, default: null},
            },
            desc: {type: String},
            timestampUpdated: {type: Date, default: Date.now, uneditable: true},
            timestampCreated: {type: Date, default: Date.now, uneditable: true},
        })

        .methods({
            getConnections: function(next) {
                var Connection = restberry.model('Connection');
                var query = {collab: this.getId()};
                //req.fields = _.union(CONNECTION_FIELDS, USER_FIELDS);
                //req.limit = null;
                Connection.find(query, function(conns) {
                    conns.toJSON(next);
                });
            },
        })
        .statics({
            connect: function(req, res, next) {
                var Connection = restberry.model('Connection');
                var self = restberry.model(MODEL_NAME);
                self.findById(req.params.id, function(collab) {
                    var d = {
                        user: req.user.getId(),
                        collab: collab.getId(),
                    };
                    Connection.create(d, function() {
                        collab.toJSON(next);
                    });
                });
            },

            expandCollab: function(json, req, res, next) {
                if (!json.collab) {
                    next(json);
                    return;
                }
                var self = restberry.model(MODEL_NAME);
                self.shouldExpandCollab(json, function() {
                    var collabId = json.collab.id;
                    self.findById(collabId, function(collab) {
                        collab.getConnections(function(conns) {
                            json.collab.connections = conns.connections;
                            next(json);
                        });
                    });
                }, next);
            },

            expandCollabs: function(json, req, res, next) {
                if (!json.collabs) {
                    next(json);
                    return;
                }
                var self = restberry.model(MODEL_NAME);
                self.shouldExpandCollab(json, function() {
                    var newCollabs = [];
                    var collabs = json.collabs;
                    utils.forEachAndDone(collabs, function(collab, iter) {
                        var collabId = collab.id;
                        self.findById(collabId, function(_collab) {
                            _collab.getConnections(function(conns) {
                                collab.connections = conns.connections;
                                newCollabs.push(collab);
                                iter();
                            });
                        });
                    }, function() {
                        json.collabs = newCollabs;
                        next(json);
                    });
                }, next);
            },

            filter: function(req, res, next) {
                var query = {};
                var f_user = req.query.user;
                if (f_user)  query['user'] = f_user;
                var f_requester = req.query.requester;
                if (f_requester)  query['requester'] = f_requester;
                var f_requestee = req.query.requestee;
                if (f_requestee)  query['requestee'] = f_requestee;
                var f_project = req.query.project;
                if (f_project)  query['project'] = f_project;
                var f_location = req.query.location;
                if (f_location) {
                    var location = f_location.split(', ');
                    query['location.city'] = location[0];
                    if (location.length > 1) {
                        query['location.country'] = location[1];
                    }
                }
                var self = restberry.model(MODEL_NAME);
                self.find(query, function(collabs) {
                    collabs.toJSON(next);
                });
            },

            shouldExpandCollab: function(json, next, done) {
                var expand = this.options().expand;
                if (_.contains(expand, this.singularName())) {
                    next();
                } else {
                    done(json);
                }
            },
        })

        .loginRequired()
        .isAuthorized(function(next) {
            // TODO
            next(true);
        })

        .routes
            .addReadRoute({
                postAction: restberry.model(MODEL_NAME).expandCollab,
            })
            .addReadManyRoute({
                actions: {
                    filter: restberry.model(MODEL_NAME).filter,
                },
                postAction: restberry.model(MODEL_NAME).expandCollabs,
            })
            .addCreateRoute({
                preAction: function(req, res, next) {
                    req.body.user = req.user.getId();
                    next();
                },
                postAction: restberry.model(MODEL_NAME).expandCollab,
            })
            .addPartialUpdateRoute({
                actions: {
                    connect: restberry.model(MODEL_NAME).connect,
                },
                postAction: restberry.model(MODEL_NAME).expandCollab,
            });
};
