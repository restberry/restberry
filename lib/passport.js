var LocalStrategy = require('passport-local').Strategy;
var logger = require('http-color-logger');


module.exports = function(passport, m) {
    passport.serializeUser(function(user, next) {
        logger.log('SESSION', 'serializeUser', user.id);
        next(null, user.id);
    });
    passport.deserializeUser(function(id, next) {
        logger.log('SESSION', 'deserializeUser', id);
        m.findById(id, next);
    });
    passport.use(new LocalStrategy(function(username, password, next) {
        logger.log('SESSION', 'authenticate', username);
        var query = {username: username};
        m.findOne(query, function(err, user) {
            if (err) {
                _throwerrors(err, next);
            } else if (!user || !user.authenticate(password)) {
                err = {
                    title: 'Authentication Error',
                    message: 'Invalid username or password.',
                };
                _throwerrors(err, next);
            } else {
                next(null, user);
            };
        });
    }));
};

var _throwerrors = function(err, next) {
    err.name = errors.AUTHENTICATION_ERRORS;
    err.type = 'ERROR';
    next(err);
};
