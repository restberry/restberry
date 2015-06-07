var _ = require('underscore');
var logger = require('restberry-logger');
var modules = require('restberry-modules');
var routes = require('restberry-router-crud');
var RestberryExpress = require('restberry-express');
var RestberryModel = require('./model');
var RestberryMongoose = require('restberry-mongoose');
var RestberryRestify = require('restberry-restify');
var RestberryRouter = require('./router');

var DEFAULT_NAME = 'APP';
var DEFAULT_ENV = null;
var DEFAULT_VERBOSE = false;
var MODULE_EXPRESS = 'express';
var MODULE_MONGOOSE = 'mongoose';
var MODULE_RESTIFY = 'restify';

function Restberry() {
    this._models = {};
    this.apiPath = '';
    this.auth = null;
    this.db = null;
    this.disableHref = false;
    this.env = DEFAULT_ENV;
    this.name = DEFAULT_NAME;
    this.odm = null;
    this.routes = new RestberryRouter(null, this);
    this.waf = null;
    this.verbose = DEFAULT_VERBOSE;

    this._setup();
}

Restberry.prototype._setup = function() {
    this.routes.use(routes);
};

Restberry.prototype.config = function(config) {
    if (!config) {
        return this;
    }
    if (config.apiPath) {
        this.setApiPath(config.apiPath);
    }
    if (config.env) {
        this.env = config.env;
    }
    if (config.name) {
        this.name = config.name;
    }
    if (config.port) {
        this.setPort(config.port);
    }
    if (config.db) {
        this.db = config.db;
    }
    this.disableHref = !!config.disableHref;
    this.verbose = !!config.verbose;
    return this;
};

Restberry.prototype.enableAuth = function(next) {
    if (!this.auth) {
        return;
    }
    if (!this.auth.auths.length) {
        var msg = 'Need to add an auth method before enabling authentication';
        throw new Error(msg);
    }
    this.auth.enable(next);
};

Restberry.prototype.getModule = function(moduleName) {
    switch (moduleName) {
        case MODULE_EXPRESS:
            return RestberryExpress;
        case MODULE_MONGOOSE:
            return RestberryMongoose;
        case MODULE_RESTIFY:
            return RestberryRestify;
        default:
            throw new Error('Illegal module');
    }
};

Restberry.prototype.listen = function(name, port, next) {
    var self = this;
    self.enableAuth();
    if (!self.waf) {
        self.use(RestberryExpress.use());
    }
    if (!self.odm) {
        self.db = 'mongodb://localhost/restberry-default';
        self.use(RestberryMongoose.use(function(odm) {
            odm.connect(self.db);
        }));
    }
    _listenArgument(name, port, next, function(name, port, next) {
        if (name) {
            self.name = name;
        }
        if (port) {
            self.waf.port = port;
        }
        self.waf.listen(self.waf.port, function() {
            if (self.env) {
                logger.info(self.name, self.env);
            }
            logger.info(self.name, self.waf.port);
            if (next) {
                next();
            }
        });
    });
};

Restberry.prototype.model = function(name) {
    if (!this.odm) {
        throw new Error('Haven\'t specified any ODM');
    }
    if (this._models[name]) {
        var model = this._models[name];
        model._options = null;
        return model;
    }
    this._models[name] = new RestberryModel(this, name);
    return this.model(name);
};

Restberry.prototype.onError = function(error, err, next) {
    err = err || {};
    this.waf.onError(error, err, next);
};

Restberry.prototype.setApiPath = function(apiPath) {
    if (this.waf) {
        this.waf.apiPath = apiPath;
        this.apiPath = null;
    } else {
        this.apiPath = apiPath;
    }
};

Restberry.prototype.setPort = function(port) {
    if (this.waf) {
        this.waf.port = port;
        this.port = null;
    } else {
        this.port = port;
    }
};

Restberry.prototype.use = function(module, callback) {
    if (_.isString(module)) {
        module = this.getModule(module);
    }
    if (callback) {
        module = module.use(callback);
    }
    var self = this;
    module.restberry = this;
    if (modules.isWAF(module)) {
        this.waf = module;
        this.setApiPath(this.apiPath);
        this.setPort(this.port);
    } else if (modules.isODM(module)) {
        this.odm = module;
    } else if (modules.isAuth(module)) {
        this.auth = module;
        _.each(this.auth.auths, function(auth) {
            auth.restberry = self;
        });
    } else {
        throw new Error('Illegal module! Could be that you are using a newer ' +
                        'module that is intended for Restberry>=1.0.0, try ' +
                        'upgrading...');
    }
    return this;
};

module.exports = exports = new Restberry;

var _listenArgument = function(name, port, next, callback) {
    if (_.isFunction(name)) {
        next = name;
    } else if (_.isNumber(name)) {
        next = port;
        port = name;
        name = undefined;
    }
    if (_.isFunction(port)) {
        next = port;
    }
    callback(name, port, next);
};
