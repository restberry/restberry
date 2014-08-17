var DEFAULT_SCHEMA = {
    googleId: {type: String, required: true},
    email: {type: String, required: true},
    name: {
        full: {type: String},
        first: {type: String},
        last: {type: String},
    },
    image: {type: String},
    gender: {type: String},
    timestampLastLogIn: {type: Date, uneditable: true},
    timestampUpdated: {type: Date, default: Date.now, uneditable: true},
    timestampCreated: {type: Date, default: Date.now, uneditable: true},
};

module.exports = function(mongoose, restberry) {
    var UserSchema = new mongoose.Schema(DEFAULT_SCHEMA);

    UserSchema.statics.getOrCreate = function(profile, next) {
        var self = this;
        self.findOne({googleId: profile.id}, function(err, user) {
            if (err) {
                next(err);
            } else if (user) {
                next(null, user);
            } else {
                var user = self({
                    googleId: profile.id,
                    email: profile.email,
                    name: {
                        full: profile.name,
                        first: profile.given_name,
                        last: profile.family_name,
                    },
                    image: profile.picture,
                    gender: profile.gender,
                });
                user.save(next);
            }
        });
    };

    restberry.model(mongoose, 'User', UserSchema);
};
