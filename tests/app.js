var restberry = require('restberry');
var utils = require('restberry-utils');


var DB = 'mongodb://localhost/restberry';

restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .web.useExpress(function(web) {
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
    .orm.useMongoose(function(orm) {
        orm.mongoose.connect(DB);
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

// -- USER --

restberry.orm.model('User')
    .routes
        .addCreate()  // POST /api/v1/users
        .addPartialUpdate()  // POST /api/v1/users/:id
        .addReadMany()  // GET /api/v1/users
            .addAction('me', {  // GET /api/v1/users?action=me
                action: function(req, res, next) {
                    req.expand.push('user');
                    req.user.toJSON(req, res, true, next);
                },
            })

// -- BAR --

restberry.orm.model('Bar')
    .setSchema({
        name: {type: String, unique: true},
        timestampUpdated: {type: Date, default: new Date(), uneditable: true},
        timestampCreated: {type: Date, default: new Date(), uneditable: true},
    })
    .apply();

restberry.orm.model('Bar')
    .routes
        .addCreate()  // POST /api/v1/bars
        .addDelete()  // DELETE /api/v1/bars/:id
        .addPartialUpdate()  // POST /api/v1/bars/:id
        .addRead()  // GET /api/v1/bars/:id
        .addReadMany()  // GET /api/v1/bars
        .addUpdate()  // PUT /api/v1/bars/:id

// -- FOO --

restberry.orm.model('Foo')
    .setSchema({
        user: {type: restberry.orm.mongoose.Schema.Types.ObjectId, ref: 'User'},
        name: {type: String},
    })
    .apply();

restberry.orm.model('Foo')
    .routes
        .addCreate({  // POST /api/v1/users/:id/foos
            parentModel: restberry.orm.model('User'),
        })
        .addRead()  // GET /api/v1/foos/:id
        .addReadMany({  // GET /api/v1/users/:id/foos
            parentModel: restberry.orm.model('User'),
        })

// -- BAZ --

restberry.orm.model('Baz')
    .setSchema({
        name: {type: String},
        nested: {
            user: {type: restberry.orm.mongoose.Schema.Types.ObjectId, ref: 'User'},
            foos: [{
                type: restberry.orm.mongoose.Schema.Types.ObjectId,
                ref: 'Foo'
            }],
        },
    })
    .isCreateAuthorized(function(req, res, next) {
        next(this.nested.user == req.user.id);
    })
    .apply();

restberry.orm.model('Baz')
    .routes
        .addCreate()  // POST /api/v1/users/:id/bazs

// -- TESTING --

restberry.routes.addCustom({
    path: '/clearData',
    action: function(req, res, next) {
        var models = restberry.orm.mongoose.models;
        var keys = Object.keys(models);
        utils.forEachAndDone(keys, function(key, iter) {
            var model = models[key];
            model.remove({}, iter);
        }, res.end);
    },
});

restberry.web.listen('restberry-test');
