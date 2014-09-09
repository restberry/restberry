var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var restberryAuth = require('restberry-auth');
var restberryAuthLocal = require('restberry-auth-local');
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
        .use(restberryAuthLocal.config({
            additionalFields: {
                name: {
                    first: {type: String},
                    last: {type: String},
                },
            },
        }))
    ).listen('RESTBERRY');

restberry.model('User')
    .routes
        .addCreate({
            loginRequired: false,
        })
        .addPartialUpdate()
        .addReadMany({
            actions: {
                me: function(req, res, next) {
                    req.expand.push(restberry.auth.getUser().singleName());
                    req.user.toJSON(req, res, next);
                },
            },
        })

restberry.model('Foo')
    .schema({
        user: {type: restberry.odm.ObjectId, ref: 'User'},
        name: {type: String},
    })
    .loginRequired()
    .routes
        .addCreate({
            parentModel: restberry.model('User'),
        })
        .addRead()
        .addReadMany({
            parentModel: restberry.model('User'),
        })

restberry.model('Baz')
    .schema({
        name: {type: String},
        nested: {
            user: {type: restberry.odm.ObjectId, ref: 'User'},
            foos: [{
                type: restberry.odm.ObjectId,
                ref: 'Foo'
            }],
        },
    })
    .isAuthorizedToCreate(function(req, res, next) {
        var nested = this.get('nested');
        next(nested && nested.user == req.user.getId());
    })
    .loginRequired()
    .routes
        .addCreate({
            parentModel: restberry.model('User'),
        })

testlib.enableClearData(restberry);
