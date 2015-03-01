var _ = require('underscore');
var util = require('util');


ACTIVITY_FORMAT_TAG = '{{%s}}';
ACTIVITY_FORMAT_CREATED = 'created new script ' + ACTIVITY_FORMAT_TAG + '.';
ACTIVITY_FORMAT_UPDATED = 'updated script ' + ACTIVITY_FORMAT_TAG+ '.';
ACTIVITY_FORMAT_BRANCHED = 'created branched script ' + ACTIVITY_FORMAT_TAG + '.';
ACTIVITY_TYPE_CREATED = 'CREATED';
ACTIVITY_TYPE_UPDATED = 'UPDATED';
ACTIVITY_TYPE_BRANCHED = 'BRANCHED';
ACTIVITY_TYPES = [
    ACTIVITY_TYPE_CREATED,
    ACTIVITY_TYPE_UPDATED,
    ACTIVITY_TYPE_BRANCHED,
];

module.exports = function(restberry) {
    restberry.model('Activity')
        .schema({
            team: {
                type: restberry.odm.ObjectId,
                ref: 'Team',
                required: true,
            },
            user: {
                type: restberry.odm.ObjectId,
                ref: 'User',
                required: true,
            },
            script: {
                type: restberry.odm.ObjectId,
                ref: 'Script',
                required: true,
            },
            type: {type: String, enum: ACTIVITY_TYPES, required: true},
            timestampUpdated: {type: Date, default: Date.now, uneditable: true},
            timestampCreated: {type: Date, default: Date.now, uneditable: true},
        })

        .populate(function(next) {
            var self = this;
            var Script = restberry.model('Script');
            Script.findById(self.get('script'), function(script) {
                var activity;
                switch (self.get('type')) {
                    case ACTIVITY_TYPE_CREATED:
                        activity = ACTIVITY_FORMAT_CREATED;
                        break;
                    case ACTIVITY_TYPE_UPDATED:
                        activity = ACTIVITY_FORMAT_UPDATED;
                        break;
                    case ACTIVITY_TYPE_BRANCHED:
                        activity = ACTIVITY_FORMAT_BRANCHED;
                        break;
                }
                next({activity: util.format(activity, script.get('name'))});
            });
        })
        .statics({
            ACTIVITY_TYPE_CREATED: ACTIVITY_TYPE_CREATED,
            ACTIVITY_TYPE_UPDATED: ACTIVITY_TYPE_UPDATED,
            ACTIVITY_TYPE_BRANCHED: ACTIVITY_TYPE_BRANCHED,
            getOrCreate: function(d, next) {
                var Activity = restberry.model('Activity');
                Activity.find(d, function(activities) {
                    var activity;
                    if (activities.length) {
                        activity = _.first(activities);
                        activity.set('timestampUpdated', new Date());
                        activity.save(next);
                    } else {
                        Activity.create(d, next);
                    }
                });
            },
        })

        .loginRequired()
        .isAuthorized(function(next) {
            var Team = restberry.model('Team');
            Team.findById(this.get('team'), function(team) {
                team.isAuthorized(next);
            });
        })

        .routes
            .addReadManyRoute({
                parentModel: restberry.model('Team'),
            });
};
