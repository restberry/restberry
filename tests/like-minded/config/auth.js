module.exports = function(auth) {
    var app = auth.restberry.waf.app;
    var express = auth.restberry.waf.express;
    var passport = auth.passport;
    app.configure(function() {
        app.use(express.cookieParser());
        app.use(express.session({
            secret: 'like-minded-secret',
        }));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(app.router);
        app.use(express.methodOverride());
    });
};
