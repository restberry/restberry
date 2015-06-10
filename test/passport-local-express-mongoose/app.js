var cookieParser = require('cookie-parser');
var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var restberryPassport = require('restberry-passport');
var restberryPassportLocal = require('restberry-passport-local');
var session = require('express-session');
var testlib = require('../testlib');

var auth = restberryPassport
    .config(function(auth) {
        var app = restberry.waf.app;
        app.use(auth.passport.initialize());
        app.use(auth.passport.session());
    })
    .use('local', {
        additionalFields: {
            name: {
                first: {type: String},
                last: {type: String},
            },
        },
    });

restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .use('express', function(waf) {
        var app = waf.app;
        app.use(cookieParser());
        app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'restberry',
        }));
    })
    .use(restberryMongoose, function(odm) {
    console.log('!')
        odm.connect('mongodb://localhost/restberry-test');
    })
    .use(auth)
    .listen('RESTBERRY');

restberry.model('User')
    .loginRequired()
    .preSave(function(next) {
        var name = this.get('name');
        if (name.first === undefined)  this.set('name', {first: 'tom'});
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
                    req.user.options().addExpand(User.singularName());
                    req.user.toJSON(next);
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
        var nested = this.get('nested');
        var user = this.restberry.waf.getUser();
        next(nested && nested.user == user.getId());
    })
    .routes
        .addCreateRoute({
            parentModel: restberry.model('User'),
        })

testlib.enableClearData(restberry);
