var _ = require('underscore')
var errors = require('./errors');
var logger = require('./logger');
var controllers = require('./controllers');
var ms = require('./mongoose_shortcuts');
var ns = require('./node_shortcuts');

var config = {
    apiPath: '',
};

exports.init = function(customConfig) {
    for (var key in customConfig) {
        config[key] = customConfig[key];
    }
};

exports.model = function(mongoose, name, pluralName, schema) {
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
    schema.statics.singleName = name.toLowerCase();
    schema.statics.pluralName = pluralName.toLowerCase();
    return mongoose.model(name, schema);
};

// Routes

exports.createAPI = function(app, m, n, auth) {
    var path = _getPath(m, n);
    console.log('POST ' + path);
    app.post(path, function(req, res, next) {
        ns.handleReq(req, res, auth, next);
    }, function(req, res, next) {
        controllers.create(req, res, m, n, next);
    }, ns.handleRes);
};

exports.readAPI = function(app, m, auth) {
    var path = _getPath(null, m)
    console.log('GET ' + path);
    app.get(path, function(req, res, next) {
        ns.handleReq(req, res, auth, next);
    }, function(req, res, next) {
        controllers.read(req, res, m, next);
    }, ns.handleRes);
};

exports.readManyAPI = function(app, m, n, auth) {
    var path = _getPath(m, n);
    console.log('GET ' + path);
    app.get(path, function(req, res, next) {
        ns.handleReq(req, res, auth, next);
    }, function(req, res, next) {
        controllers.readMany(req, res, m, n, next);
    }, ns.handleRes);
};

// Helper

var _getPath = function(m, n) {
    var path = null;
    if (n) {
        path = config.apiPath + '/' + n.pluralName + '/:id';
        if (m)  path += '/' + m.pluralName;
    } else if (m) {
        path = config.apiPath + '/' + m.pluralName;
    }
    return path;
};
