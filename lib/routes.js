var controllers = require('./controllers');
var ns = require('./node_shortcuts');


var CONFIG = null;

module.exports = function(config) {
    CONFIG = config;
    return routes;
};

var routes = {
    create: function(app, m, n, config) {
        config = _setupConfig(config);
        config.path = _getPath(m, n);
        config.action = function(req, res, next) {
            controllers.create(req, res, m, n, next);
        };
        if (m === CONFIG.authModel) {
            config.preAction = function(req, res, next) {
                req.body._encryptPassword = req.body.password;
                delete req.body.password;
                next();
            };
        }
        _route(app, 'POST', config);
    },

    del: function(app, m, config) {
        config = _setupConfig(config);
        config.path = _getPath(null, m);
        config.action = function(req, res, next) {
            controllers.del(req, res, m, next);
        };
        _route(app, 'DELETE', config);
    },

    read: function(app, m, config) {
        config = _setupConfig(config);
        config.path = _getPath(null, m);
        config.action = function(req, res, next) {
            controllers.read(req, res, m, next);
        };
        _route(app, 'GET', config);
    },

    readMany: function(app, m, n, config) {
        config = _setupConfig(config);
        config.path = _getPath(m, n);
        config.action = function(req, res, next) {
            controllers.readMany(req, res, m, n, next);
        };
        _route(app, 'GET', config);
    },

    login: function(app, passport) {
        var config = _setupConfig({
            path: CONFIG.apiPath + '/login',
            preAction: passport.authenticate('local'),
            action: function(req, res, next) {
                controllers.login(req, res, next);
            },
        });
        _route(app, 'POST', config);
    },

    logout: function(app) {
        var config = _setupConfig({
            path: CONFIG.apiPath + '/logout',
            action: function(req, res, next) {
                controllers.logout(req, res, next);
            },
        });
        _route(app, 'GET', config);
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

var _route = function(app, method, config) {
    if (config.verbose)  console.log(method, config.path);
    switch (method) {
        case 'DELETE':
            app.del(config.path, config.preReq, config.preAction,
                    config.action, config.postAction, ns.handleRes,
                    config.postRes);
            break;
        case 'GET':
            app.get(config.path, config.preReq, config.preAction,
                    config.action, config.postAction, ns.handleRes,
                    config.postRes);
            break;
        case 'POST':
            app.post(config.path, config.preReq, config.preAction,
                     config.action, config.postAction, ns.handleRes,
                     config.postRes);
            break;
        case 'PUT':
            app.put(config.path, config.preReq, config.preAction,
                    config.action, config.postAction, ns.handleRes,
                    config.postRes);
            break;
    }
};

var _setupConfig = function(config) {
    var emptyFun = function(req, res, next) { next(); };
    var authenticate = (config ? config.authenticate : false);
    var setupConfig = {
        preReq: function(req, res, next) {
            req.authModel = CONFIG.authModel;
            req.authenticate = authenticate;
            ns.handleReq(req, res, authenticate, next);
        },
        preAction: emptyFun,
        postAction: emptyFun,
        postRes: emptyFun,
    };
    for (var key in config) {
        setupConfig[key] = config[key];
    }
    return setupConfig;
};
