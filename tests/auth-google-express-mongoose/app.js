var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var restberryAuth = require('restberry-auth');
var restberryAuthGoogle = require('restberry-auth-google');
var testlib = require(process.env.NODE_PATH + '/testlib');


restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .use(restberryExpress.use(function(waf) {
        var app = waf.app;
        var express = waf.express;
        app.use(express.cookieParser());
        app.use(express.json());
        app.use(express.urlencoded());
        app.use(express.session({
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
            app.use(app.router);
            app.use(restberry.waf.express.methodOverride());
        })
        .use(restberryAuthGoogle.config({
            //clientID: 'id',
            //clientSecret: 'secret',
            clientID: '23835612237-i40710qkfdcnemedvvn17g7aoufmiuk9.' +
                      'apps.googleusercontent.com',
            clientSecret: 'MlVq-52ds_lbUl28ntfQ2TOa',
        }))
    ).listen('RESTBERRY');

restberry.model('User')
    .routes
        .addCreateRoute({
            loginRequired: false,
        })
        .addPartialUpdateRoute()
        .addReadManyRoute({
            actions: {
                me: function(req, res, next) {
                    req.expand.push(restberry.auth.getUser().singleName());
                    req.user.toJSON(req, res, next);
                },
            },
        })

testlib.enableClearData(restberry);
