var utils = require('./utils');


var PASSWORD_MIN_LEN = 8;
var DEFAULT_SCHEMA = {
    username: {type: String, required: true, unique: true},
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
    timestampLastLogIn: {type: Date, uneditable: true},
    timestampCreated: {type: Date, default: Date.now, uneditable: true},
    timestampUpdated: {type: Date, default: Date.now, uneditable: true},
};

module.exports = function(mongoose, restberry, additionalFields) {
    var UserSchema = new mongoose.Schema(_setupSchema(additionalFields));
    UserSchema
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
    UserSchema
        .virtual('_email')
            .set(function(email) {
                this.email = email;
                this.username = (this.username ? this.username : email);
            })
    UserSchema
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
