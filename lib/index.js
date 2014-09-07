var _ = require('underscore');
var logger = require('restberry-logger');
var modules = require('restberry-modules');
var RestberryAuth = require('restberry-auth');
var RestberryModel = require('restberry-model');
var RestberryRoute = require('restberry-router');
var utils = require('restberry-utils');


var DEFAULT_NAME = 'APP';
var DEFAULT_ENV = null;
var DEFAULT_VERBOSE = false;

function Restberry() {
    this.auth = null;
    this.env = DEFAULT_ENV;
    this.name = DEFAULT_NAME;
    this.odm = null;
    this.routes = new RestberryRoute(null, this);
    this.waf = null;
    this.verbose = DEFAULT_VERBOSE;
};

Restberry.prototype.config = function(config) {
    if (config.apiPath)  this.setApiPath(config.apiPath);
    if (config.env)  this.env = config.env;
    if (config.name)  this.name = config.name;
    if (config.port)  this.setPort(config.port);
    this.verbose = config.verbose;
    return this;
};

Restberry.prototype.listen = function(name, port, next) {
    var self = this;
    self.enableAuth();
    _listenArgument(name, port, next, function(name, port, next) {
        if (name)  self.name = name;
        if (port)  self.waf.port = port;
        self.waf.listen(self.waf.port, function() {
            if (self.env)  logger.info(self.name, self.env);
            logger.info(self.name, self.waf.port);
            if (next)  next();
        });
    });
};

Restberry.prototype.model = function(name) {
    if (!this.odm)  throw new Error('Haven\'t specified any odm');
    return new RestberryModel(this, name);
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

Restberry.prototype.use = function(module) {
    var self = this;
    module.restberry = this;
    if (module.__class__ === modules.waf) {
        this.waf = module;
        this.setApiPath(this.apiPath);
        this.setPort(this.port);
    } else if (module.__class__ === modules.odm) {
        this.odm = module;
    } else if (module.__class__ === RestberryAuth.__class__) {
        this.auth = module;
        _.each(this.auth.auths, function(auth) {
            auth.restberry = self;
        });
    } else {
        throw new Error('Illegal module');
    }
    return this;
};

Restberry.prototype.enableAuth = function(next) {
    if (!this.auth)  return;
    if (!this.auth.auths.length) {
        var msg = 'Need to add an auth method before enabling authentication';
        throw new Error(msg);
    }
    this.auth.enable(next);
};

module.exports = exports = new Restberry;

var _listenArgument = function(a, b, c, next) {
    var name, port, n;
    if (a) {
        if (_.isFunction(a)) {
            n = a;
        } else if (_.isNumber(a)) {
            port = a;
        } else {
            name = a;
        }
    }
    if (b) {
        if (_.isFunction(b)) {
            n = b;
        } else if (_.isNumber(b)) {
            port = b;
        }
    }
    if (c && _.isFunction(c)) {
        n = c;
    }
    next(name, port, n);
};
