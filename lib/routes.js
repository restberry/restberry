var controllers = require('./controllers');
var ns = require('./node_shortcuts');


var CONFIG = null;

module.exports = function(config) {
    CONFIG = config;
    return routes;
};

var routes = {
    create: function(app, m, n, auth) {
        var path = _getPath(m, n);
        app.post(path, function(req, res, next) {
            req.authModel = CONFIG.authModel;
            ns.handleReq(req, res, auth, next);
        }, function(req, res, next) {
            controllers.create(req, res, m, n, next);
        }, ns.handleRes);
    },

    del: function(app, m, auth) {
        var path = _getPath(null, m)
        console.log('DEL ' + path);
        app.del(path, function(req, res, next) {
            req.authModel = CONFIG.authModel;
            ns.handleReq(req, res, auth, next);
        }, function(req, res, next) {
            controllers.del(req, res, m, next);
        }, ns.handleRes);
    },

    read: function(app, m, auth) {
        var path = _getPath(null, m)
        app.get(path, function(req, res, next) {
            req.authModel = CONFIG.authModel;
            ns.handleReq(req, res, auth, next);
        }, function(req, res, next) {
            controllers.read(req, res, m, next);
        }, ns.handleRes);
    },

    readMany: function(app, m, n, auth) {
        var path = _getPath(m, n);
        console.log('GET ' + path);
        app.get(path, function(req, res, next) {
            req.authModel = CONFIG.authModel;
            ns.handleReq(req, res, auth, next);
        }, function(req, res, next) {
            controllers.readMany(req, res, m, n, next);
        }, ns.handleRes);
    },

    login: function(app, passport) {
        var auth = passport.authenticate('local');
        var path = CONFIG.apiPath + '/login';
        app.post(path, function(req, res, next) {
            ns.handleReq(req, res, false, next);
        }, auth, function(req, res, next) {
            controllers.login(req, res, next);
        }, ns.handleRes);
    },

    logout: function(app) {
        var path = CONFIG.apiPath + '/logout';
        app.get(path, function(req, res, next) {
            ns.handleReq(req, res, false, next);
        }, function(req, res, next) {
            controllers.logout(req, res, next);
        }, ns.handleRes);
    },
};

var _getPath = function(m, n) {
    var path = null;
    if (n) {
        path = CONFIG.apiPath + '/' + n.pluralName() + '/:id';
        if (m)  path += '/' + m.pluralName();
    } else if (m) {
        path = CONFIG.apiPath + '/' + m.pluralName();
    }
    return path;
};
