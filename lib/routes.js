var controllers = require('./controllers');
var errors = require('./errors');
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
        _handlePassword(m, config, function() {
            _route(app, 'POST', config);
        });
    },

    del: function(app, m, config) {
        config = _setupConfig(config);
        config.path = _getPath(null, m);
        config.action = function(req, res, next) {
            controllers.del(req, res, m, next);
        };
        _route(app, 'DELETE', config);
    },

    login: function(app) {
        var config = _setupConfig({
            path: CONFIG.apiPath + '/login',
            preAction: CONFIG.passport.authenticate('local'),
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

    partialUpdate: function(app, m, config) {
        config = _setupConfig(config);
        config.path = _getPath(null, m);
        config.action = function(req, res, next) {
            _handleAction(req, res, config, function(next) {
                controllers.update(req, res, m, next);
            }, next);
        };
        _handlePassword(m, config, function() {
            _route(app, 'POST', config);
        });
    },

    read: function(app, m, config) {
        config = _setupConfig(config);
        config.path = _getPath(null, m);
        config.action = function(req, res, next) {
            _handleAction(req, res, config, function(next) {
                controllers.read(req, res, m, next);
            }, next);
        };
        _route(app, 'GET', config);
    },

    readMany: function(app, m, n, config) {
        config = _setupConfig(config);
        config.path = _getPath(m, n);
        config.action = function(req, res, next) {
            _handleAction(req, res, config, function(next) {
                controllers.readMany(req, res, m, n, next);
            }, next);
        };
        _route(app, 'GET', config);
    },

    update: function(app, m, config) {
        config = _setupConfig(config);
        config.path = _getPath(null, m);
        config.action = function(req, res, next) {
            controllers.update(req, res, m, next);
        };
        _route(app, 'PUT', config);
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
    if (CONFIG.verbose)  console.log(method, config.path);
    switch (method) {
        case 'DELETE':
            app.del(config.path, config.preReq, config.preAction,
                    config.action, config.postAction, ns.handleRes);
            break;
        case 'GET':
            app.get(config.path, config.preReq, config.preAction,
                    config.action, config.postAction, ns.handleRes);
            break;
        case 'POST':
            app.post(config.path, config.preReq, config.preAction,
                     config.action, config.postAction, ns.handleRes);
            break;
        case 'PUT':
            app.put(config.path, config.preReq, config.preAction,
                    config.action, config.postAction, ns.handleRes);
            break;
    }
};

var _setupConfig = function(config) {
    var emptyFun = function(req, res, next) { next(); };
    var authenticate = (config ? config.authenticate : false);
    var setupConfig = {
        preReq: function(req, res, next) {
            req.apiPath = CONFIG.apiPath;
            req.authModel = CONFIG.authModel;
            req.authenticate = authenticate;
            ns.handleReq(req, res, authenticate, next);
        },
        preAction: emptyFun,
        postAction: emptyFun,
    };
    for (var key in config) {
        setupConfig[key] = config[key];
    }
    return setupConfig;
};

var _handleAction = function(req, res, config, action, next) {
    if (req.query.action && config.actions) {
        var action = config.actions[req.query.action];
        if (action) {
            action(req, res, next);
        } else {
            var err = {message: 'Illegal action'};
            errors.throwBadRequest(req, res, err);
        }
    } else {
       action(next);
    }
};

var _handlePassword = function(m, config, next) {
    if (m === CONFIG.authModel) {
        config.preAction = function(req, res, next) {
            if (req.body.email) {
                req.body._email = req.body.email;
                delete req.body.email;
            }
            if (req.body.password) {
                req.body._encryptPassword = req.body.password;
                delete req.body.password;
            }
            next();
        };
        config.postAction = function(json, req, res, next) {
            m.findByIdAndVerify(req, res, json.user.id, function(user) {
                req.logIn(user, null, function() {
                    next(json);
                });
            });
        };
    }
    next();
};
