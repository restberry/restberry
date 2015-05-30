var cookieParser = require('cookie-parser');
var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var restberryAuth = require('restberry-auth');
var restberryAuthGoogle = require('restberry-auth-google');
var session = require('express-session');
var testlib = require('../testlib');

restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .use(restberryExpress.use(function(waf) {
        var app = waf.app;
        app.use(cookieParser());
        app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'restberry',
        }));
    }))
    .use(restberryMongoose.use(function(odm) {
        odm.connect('mongodb://localhost/restberry-test');
    }))
    .use(restberryAuth.use(function(auth) {
            var app = restberry.waf.app;
            app.use(auth.passport.initialize());
            app.use(auth.passport.session());
        })
        .use(restberryAuthGoogle.config({
            clientID: 'id',
            clientSecret: 'secret',
        }))
    ).listen('RESTBERRY');

restberry.model('User')
    .loginRequired()
    .routes
        .addCreateRoute({
            loginRequired: false,
        })
        .addPartialUpdateRoute()
        .addReadManyRoute({
            actions: {
                me: function(req, res, next) {
                    var User = restberry.auth.getUser();
                    req.user.options().addExpand(User.singleName());
                    req.user.toJSON(next);
                },
            },
        })

testlib.enableClearData(restberry);
