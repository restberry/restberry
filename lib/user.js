var utils = require('./utils');


var PASSWORD_MIN_LEN = 8;
var DEFAULT_SCHEMA = {
    username: {type: String, unique: true},
    email: {
        type: String,
        validate: [utils.isValidEmail, 'invalid email'],
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        encrypted: {type: String},
        salt: {type: String},
    },
    timestampLastLogIn: {type: Date},
    timestampCreated: {type: Date, default: Date.now},
    timestampUpdated: {type: Date, default: Date.now},
};

module.exports = function(mongoose, restberry, additionalFields) {
    var UserSchema = new mongoose.Schema(_setupSchema(additionalFields));
    UserSchema
        .index({username: 1, email: 1})
        .pre('save', function(next) {
            if (!this.username || !this.username.length) {
                this.username = this.email;
            };
            var p = this.password;
            if (p && p.salt && p.salt.length &&
                p.encrypted && p.encrypted.length) {
                next();
            } else {
                next(new Error('Invalid password, needs to be at lest ' +
                               PASSWORD_MIN_LEN + ' characters long'));
            };
        })
        .virtual('_encryptPassword')
            .set(function(password) {
                if (password && password.length >= PASSWORD_MIN_LEN) {
                    this.password = {} ;
                    this.password.salt = utils.makeSalt();
                    this.password.encrypted = this.encryptPassword(password);
                };
            });

    restberry.model(mongoose, 'User', UserSchema);
};

var _setupSchema = function(additionalFields) {
    var schema = (additionalFields ? additionalFields : {});
    for (var key in DEFAULT_SCHEMA) {
        schema[key] = DEFAULT_SCHEMA[key];
    }
    return schema;
};
