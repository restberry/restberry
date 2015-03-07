var cookieParser = require('cookie-parser');
var session = require('express-session');

module.exports = function(auth) {
    var app = auth.restberry.waf.app;
    var passport = auth.passport;
    app.use(cookieParser());
    app.use(session({
        resave: false,
        saveUninitialized: false,
        secret: 'like-minded-secret',
    }));
    app.use(passport.initialize());
    app.use(passport.session());
};
