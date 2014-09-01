var restberry = require('restberry');
var utils = require('restberry-utils');


restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .useExpress(function(web) {
        var app = web.app;
        var express = web.express;
        app.configure(function() {
            app.use(express.cookieParser());
            app.use(express.json());
            app.use(express.urlencoded());
            app.use(express.session({
                secret: 'restberry secret',
            }));
        });
    })
    .useMongoose(function(orm) {
        orm.connect('mongodb://localhost/restberry-test');
    })

restberry
    .auth
        .useLocal({
            additionalFields: {
                name: {
                    first: {type: String},
                    last: {type: String},
                },
            },
        })
        .apply(function(web, passport) {
            var app = web.app;
            app.use(passport.initialize());
            app.use(passport.session());
        });

var ObjectId = restberry.orm.mongoose.Schema.Types.ObjectId;

// -- USER --

restberry.model('User')
    .setLoginRequired()
    .routes
        .addCreate({
            loginRequired: false,
        })  // POST /api/v1/users
        .addPartialUpdate()  // POST /api/v1/users/:id
        .addReadMany()  // GET /api/v1/users
            .addAction('me', {
                action: function(req, res, next) {
                    req.expand.push('user');
                    req.user.toJSON(req, res, true, next);
                },
            })  // GET /api/v1/users?action=me

// -- BAR --

restberry.model('Bar')
    .setSchema({
        name: {type: String, unique: true},
        timestampUpdated: {type: Date, default: new Date(), uneditable: true},
        timestampCreated: {type: Date, default: new Date(), uneditable: true},
    })
    .apply();

restberry.model('Bar')
    .routes
        .addCreate()  // POST /api/v1/bars
        .addDelete()  // DELETE /api/v1/bars/:id
        .addPartialUpdate()  // POST /api/v1/bars/:id
        .addRead()  // GET /api/v1/bars/:id
        .addReadMany()  // GET /api/v1/bars
        .addUpdate()  // PUT /api/v1/bars/:id

// -- FOO --

restberry.model('Foo')
    .setSchema({
        user: {type: ObjectId, ref: 'User'},
        name: {type: String},
    })
    .apply();

restberry.model('Foo')
    .setLoginRequired()
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
    .setSchema({
        name: {type: String},
        nested: {
            user: {type: ObjectId, ref: 'User'},
            foos: [{
                type: ObjectId,
                ref: 'Foo'
            }],
        },
    })
    .isCreateAuthorized(function(req, res, next) {
        next(this.nested.user == req.user.id);
    })
    .apply();

restberry.model('Baz')
    .setLoginRequired()
    .routes
        .addCreate({
            parentModel: restberry.model('User'),
        })  // POST /api/v1/users/:id/bazs

// -- TESTING --

restberry.routes.addCustom({
    path: '/clearData',
    action: function(req, res, next) {
        var models = restberry.orm.mongoose.models;
        var keys = Object.keys(models);
        utils.forEachAndDone(keys, function(key, iter) {
            var model = models[key];
            model.remove(function() {
                iter();
            });
        }, function() {
           restberry.web.handleRes({}, req, res, next);
        });
    },
});

// -- WEB --

restberry.listen('restberry-test');
