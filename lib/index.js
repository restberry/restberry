var _ = require('underscore');
var logger = require('restberry-logger');
var routes = require('restberry-router-crud');
var RestberryAuth = require('./auth');
var RestberryModel = require('./model');
var RestberryODM = require('./odm');
var RestberryRouter = require('./router');
var RestberryWAF = require('./waf');
var util = require('util');

var DEFAULT_NAME = 'APP';
var DEFAULT_ENV = undefined;
var DEFAULT_VERBOSE = false;
var MODULE_EXPRESS = 'express';
var MODULE_MONGOOSE = 'mongoose';

function Restberry() {
    this._models = {};

    this.apiPath = '';
    this.auth = undefined;
    this.db = undefined;
    this.disableHref = false;
    this.env = DEFAULT_ENV;
    this.name = DEFAULT_NAME;
    this.odm = undefined;
    this.routes = new RestberryRouter(undefined, this);
    this.waf = undefined;
    this.verbose = DEFAULT_VERBOSE;

    this.routes.use(routes);
}

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
    if (this.auth) {
        this.auth.enable(next);
    }
};

Restberry.prototype.getModule = function(moduleName) {
    switch (moduleName) {
        case MODULE_EXPRESS:
            return require('restberry-express');
        case MODULE_MONGOOSE:
            return require('restberry-mongoose');
        default:
            throw new Error('Illegal module');
    }
};

Restberry.prototype.listen = function(name, port, next) {
    var self = this;
    self.enableAuth();
    if (!self.waf) {
        self.use('express');
    }
    if (!self.odm) {
        self.db = self.db || 'mongodb://localhost/restberry-default';
        self.use('mongoose', function(odm) {
            odm.connect(self.db);
        });
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
        model._options = undefined;
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
        this.apiPath = undefined;
    } else {
        this.apiPath = apiPath;
    }
};

Restberry.prototype.setPort = function(port) {
    if (this.waf) {
        this.waf.port = port;
        this.port = undefined;
    } else {
        this.port = port;
    }
};

Restberry.prototype.use = function(module, callback) {
    if (!module) {
        return this;
    } else if (_.isString(module)) {
        module = this.getModule(module);
    }
    if (module.__class__) {
        // NOTE(materik):
        // * legacy
        throw new Error('You are trying to use a module that is intended ' +
                        'for Restberry<1.0.0, please upgrade you modules');
    } else if (RestberryWAF.canApply(module)) {
        module = module.config(callback);
        this.waf = new RestberryWAF(module);
        this.waf.setRestberry(this);
        this.setApiPath(this.apiPath);
        this.setPort(this.port);
    } else if (RestberryODM.canApply(module)) {
        module = module.config(callback);
        this.odm = new RestberryODM(module);
        this.odm.setRestberry(this);
    } else if (RestberryAuth.canApply(module)) {
        module = module.config(callback);
        this.auth = new RestberryAuth(module);
        this.auth.setRestberry(this);
    } else {
        throw new Error('Illegal module');
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
