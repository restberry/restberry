var cookieParser = require('cookie-parser');
var restberry = require('restberry');
var restberryPassport = require('restberry-passport');
var restberryPassportLocal = require('restberry-passport-local');
var restberryMongoose = require('restberry-mongoose');
var restberryRestify = require('restberry-restify');
var session = require('client-sessions');
var testlib = require('../testlib');

restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .use(restberryRestify, function(waf) {
        var server = waf.server;
        server.use(cookieParser());
        server.use(session({
            cookieName: 'session',
            resave: false,
            saveUninitialized: false,
            secret: 'restberry',
        }));
    })
    .use('mongoose', function(odm) {
        odm.connect('mongodb://localhost/restberry-test');
    })
    .use(restberryPassport.config({
            additionalFields: {
                name: {
                    first: {type: String},
                    last: {type: String},
                },
            },
        }, function(auth) {
            var server = restberry.waf.server;
            server.use(auth.passport.initialize());
            server.use(auth.passport.session());
        })
        .use(restberryPassportLocal.config())
    ).listen('RESTBERRY');

restberry.model('User')
    .loginRequired()
    .preSave(function(next) {
        if (!this.name || this.name.first === undefined) {
            this.name = {first: 'tom'};
        }
        next();
    })
    .routes
        .addCreateRoute({
            isLoginRequired: false,
        })
        .addPartialUpdateRoute()
        .addReadManyRoute({
            actions: {
                me: function(req, res, next) {
                    var User = restberry.auth.getUser();
                    req.user.expandJSON();
                    req.user.toJSON(function(json) {
                        res._body = json;
                        next(json);
                    });
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
        .addCreateRoute({
            parentModel: restberry.model('User'),
        })
        .addReadRoute()
        .addReadManyRoute({
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
    .loginRequired()
    .isAuthorizedToCreate(function(next) {
        var user = this.restberry.waf.getUser();
        next(this.nested && this.nested.user == user.id);
    })
    .routes
        .addCreateRoute({
            parentModel: restberry.model('User'),
        })

testlib.enableClearData(restberry);
