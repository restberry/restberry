var utils = require('./utils');


var PASSWORD_MIN_LEN = 8;

module.exports = function(mongoose, restberry) {
    var UserSchema = new mongoose.Schema({
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
        name: {
            first: {type: String, default: ''},
            last: {type: String, default: ''},
        },
        timestampLastLogIn: {type: Date},
        timestampCreated: {type: Date, default: Date.now},
        timestampUpdated: {type: Date, default: Date.now},
    });

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
