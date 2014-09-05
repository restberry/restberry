var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var restberryAuth = require('restberry-auth');
var restberryAuthLocal = require('restberry-auth-local');
var utils = require('restberry-utils');


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
    .use(restberryAuth.use(function(passport) {
            var app = restberry.waf.app;
            var express = restberry.waf.express;
            app.use(passport.initialize());
            app.use(passport.session());
            app.use(app.router);
            app.use(express.methodOverride());
        })
        .use(restberryAuthLocal.use({
            additionalFields: {
                name: {
                    first: {type: String},
                    last: {type: String},
                },
            },
        }))
    )
    .listen('RESTBERRY');

var ObjectId = restberry.odm.ObjectId;

// -- USER --

restberry.model('User')
    .loginRequired()
    .routes
        .addCreate({
            loginRequired: false,
        })  // POST /api/v1/users
        .addPartialUpdate()  // POST /api/v1/users/:id
        .addReadMany({
            actions: {
                me: function(req, res, next) {
                    req.expand.push('user');
                    req.user.toJSON(req, res, true, next);
                },
            },
        })  // GET /api/v1/users

// -- BAR --

restberry.model('Bar')
    .schema({
        name: {type: String, unique: true},
        timestampUpdated: {type: Date, default: new Date(), uneditable: true},
        timestampCreated: {type: Date, default: new Date(), uneditable: true},
    })
    .routes
        .addCreate()  // POST /api/v1/bars
        .addDelete()  // DELETE /api/v1/bars/:id
        .addPartialUpdate()  // POST /api/v1/bars/:id
        .addRead()  // GET /api/v1/bars/:id
        .addReadMany()  // GET /api/v1/bars
        .addUpdate()  // PUT /api/v1/bars/:id

// -- FOO --

restberry.model('Foo')
    .schema({
        user: {type: ObjectId, ref: 'User'},
        name: {type: String},
    })
    .loginRequired()
    .routes
        .addCreate({
            parentModel: restberry.model('User'),
        })  // POST /api/v1/users/:id/foos
        .addRead()  // GET /api/v1/foos/:id
        .addReadMany({
            parentModel: restberry.model('User'),
        })  // GET /api/v1/users/:id/foos

// -- BAZ --

restberry.model('Baz')
    .schema({
        name: {type: String},
        nested: {
            user: {type: ObjectId, ref: 'User'},
            foos: [{
                type: ObjectId,
                ref: 'Foo'
            }],
        },
    })
    .isAuthorizedToCreate(function(req, res, next) {
        next(this.nested.user == req.user.id);
    })
    .loginRequired()
    .routes
        .addCreate({
            parentModel: restberry.model('User'),
        })  // POST /api/v1/users/:id/bazs

// -- TESTING --

restberry.routes.addCustom({
    path: '/clearData',
    action: function(req, res, next) {
        var models = restberry.odm.mongoose.models;
        var keys = Object.keys(models);
        utils.forEachAndDone(keys, function(key, iter) {
            var model = models[key];
            model.remove(function() {
                iter();
            });
        }, function() {
            res.status(204);
            restberry.waf.handleRes({}, req, res, next);
        });
    },
});
