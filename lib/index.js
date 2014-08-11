var _ = require('underscore')
var errors = require('./errors');
var ms = require('./mongoose_shortcuts');
var logger = require('http-color-logger');
var utils = require('./utils');


var CONFIG = {
    apiPath: '',
    auth: {
        model: null,
        google: null,
    },
    port: 5000,
};
var ROUTES = require('./routes')(CONFIG);

exports.config = function(config) {
    for (var key in config) {
        CONFIG[key] = config[key];
    }
    ROUTES = require('./routes')(CONFIG);
};

exports.listen = function(app) {
    app.listen(CONFIG.port, function() {
        logger.log('APP', CONFIG.port);
    });
};

exports.model = function(mongoose, name, schema) {
    var customMethods = _.clone(schema.methods);
    schema.methods = _.clone(ms.methods);
    for (var key in customMethods) {
        schema.methods[key] = customMethods[key];
    }
    var customStatics = _.clone(schema.statics);
    schema.statics = _.clone(ms.statics);
    for (var key in customStatics) {
        schema.statics[key] = customStatics[key];
    }
    return mongoose.model(name, schema);
};

exports.enableAuth = function(app, passport, mongoose, additionalFields) {
    require('./user')(mongoose, this, additionalFields);
    var User = mongoose.model('User');
    this.enableAuthWithModel(app, passport, User);
};

exports.enableAuthWithGoogle = function(app, passport, mongoose) {
    require('./userGoogle')(mongoose, this);
    var User = mongoose.model('User');
    this.enableAuthWithModel(app, passport, User, 'google');
};

exports.enableAuthWithModel = function(app, passport, authModel, authType) {
    require('./passport')(passport, authModel, CONFIG);
    CONFIG.auth.model = authModel;
    CONFIG.passport = passport;
    _setupAuthRoutes(app, authType);
};

exports.controllers = require('./controllers');
exports.errors = errors;
exports.routes = ROUTES;
exports.utils = utils;

var _setupAuthRoutes = function(app, authType) {
    ROUTES = require('./routes')(CONFIG);
    if (authType == 'google') {
        ROUTES.google.callback(app);
        ROUTES.google.login(app);
    } else {
        ROUTES.login(app);
    }
    ROUTES.logout(app);
}
