var cookieParser = require('cookie-parser');
var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var restberryPassport = require('restberry-passport');
var restberryPassportGoogle = require('restberry-passport-google');
var session = require('express-session');
var testlib = require('../testlib');

restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .use(restberryExpress.config(function(waf) {
        var app = waf.app;
        app.use(cookieParser());
        app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'restberry',
        }));
    }))
    .use(restberryMongoose.config(function(odm) {
        odm.connect('mongodb://localhost/restberry-test');
    }))
    .use(restberryPassport.config(function(auth) {
            var app = restberry.waf.app;
            app.use(auth.passport.initialize());
            app.use(auth.passport.session());
        })
        .use(restberryPassportGoogle.config({
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
