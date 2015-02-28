var _ = require('underscore');


var ERROR_CONNECT_TO_SELF = 'Can\'t connect to your own collaboration.';
var ERROR_ALREADY_CONNECTED = 'You have already connected to this collaboration.';
var MODEL_NAME = 'Connection';

module.exports = function(restberry) {
    restberry.model(MODEL_NAME)
        .schema({
            user: {
                type: restberry.odm.ObjectId,
                ref: 'User',
                required: true,
            },
            collab: {
                type: restberry.odm.ObjectId,
                ref: 'Collab',
                required: true,
            },
            approved: {
                type: Boolean,
                uneditable: true,
                required: true,
                default: false
            },
            timestampApproved: {type: Date, uneditable: true},
            timestampUpdated: {type: Date, default: Date.now, uneditable: true},
            timestampCreated: {type: Date, default: Date.now, uneditable: true},
        })

        .statics({
            approve: function(req, res, next) {
                var id = req.params.id;
                this.findById(id, function(con) {
                    con.set('timestampApproved', new Date());
                    con.set('approved', true);
                    con.save(function() {
                        req.expand.push('connection');
                        con.toJSON(next);
                    })
                });
            },
        })

        .preSave(function(next) {
            var self = this;
            var Collab = restberry.model('Collab');
            Collab.findById(self.get('collab'), function(collab) {
                var userId = self.get('user').toString();
                if (userId ===
                    collab.get('user').toString()) {
                    next(new Error(ERROR_CONNECT_TO_SELF));
                    return;
                }
                var query = {collab: collab.getId()};
                self.model.find(query, function(collabs) {
                    var users = _.map(collabs, function(collab) {
                        return collab.get('user').toString();
                    });
                    if (_.contains(users, userId)) {
                        next(new Error(ERROR_ALREADY_CONNECTED));
                    } else {
                        next();
                    }
                });
            });
        })

        .loginRequired()
        .isAuthorized(function(next) {
            // TODO
            next(true);
        })

        .routes
            .addReadRoute()
            .addPartialUpdateRoute({
                actions: {
                    approve: restberry.model(MODEL_NAME).approve,
                },
            });
};
