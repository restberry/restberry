var _ = require('underscore')
var errors = require('./errors');
var ms = require('./mongoose_shortcuts');
var logger = require('http-color-logger');
var utils = require('./utils');


var CONFIG = {
    apiPath: '',
    authModel: null,
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

exports.enableAuthWithModel = function(app, passport, m) {
    require('./passport')(passport, m);
    CONFIG.authModel = m;
    CONFIG.passport = passport;
    ROUTES = require('./routes')(CONFIG);
    ROUTES.login(app);
    ROUTES.logout(app);
};

exports.routes = ROUTES;
exports.errors = errors;
exports.utils = utils;
