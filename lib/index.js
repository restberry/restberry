var _ = require('underscore')
var ms = require('./mongoose_shortcuts');
var ns = require('./node_shortcuts');


var CONFIG = {
    apiPath: '',
    authModel: null,
};
var ROUTES = require('./routes')(CONFIG);

exports.config = function(config) {
    for (var key in config) {
        CONFIG[key] = config[key];
    }
    ROUTES = require('./routes')(CONFIG);
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

exports.enableAuth = function(app, passport, m) {
    require('./passport')(passport, m);
    CONFIG.authModel = m;
    ROUTES.login(app, passport);
    ROUTES.logout(app);
    ROUTES = require('./routes')(CONFIG);
};

exports.routes = ROUTES;
