var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LocalStrategy = require('passport-local').Strategy;
var logger = require('http-color-logger');
var errors = require('./errors');


module.exports = function(passport, authModel, config) {
    passport.serializeUser(function(user, next) {
        next(null, user.id);
    });
    passport.deserializeUser(function(id, next) {
        authModel.findById(id, next);
    });

    // Local
    passport.use(new LocalStrategy(function(username, password, next) {
        logger.log('SESSION', 'authenticate', username);
        var query = {username: username};
        authModel.findOne(query, function(err, user) {
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

    // Google Strategy
    if (config.auth.google) {
        var googleConfig = config.auth.google;
        googleConfig.callbackURL = googleConfig.callbackHost
        googleConfig.callbackURL += config.apiPath + '/login/google/callback';
        var googleStrategyCallback = function(a, b, profile, next) {
            logger.log('SESSION', 'authenticate', profile.id);
            authModel.getOrCreate(profile._json, function(err, user) {
                if (err) {
                    _throwerrors(err, next);
                } else {
                    next(null, user);
                }
            });
        };
        passport.use(new GoogleStrategy(googleConfig, googleStrategyCallback));
    }
};

var _throwerrors = function(err, next) {
    err.name = errors.AUTHENTICATION_ERRORS;
    err.type = 'ERROR';
    next(err);
};
