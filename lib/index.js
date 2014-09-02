var _ = require('underscore');
var logger = require('restberry-logger');
var RestberryAuth = require('restberry-auth');
var RestberryModel = require('restberry-model');
var RestberryModules = require('restberry-modules');
var RestberryRoute = require('restberry-router');
var utils = require('restberry-utils');


var DEFAULT_NAME = 'APP';
var DEFAULT_VERBOSE = false;

function Restberry() {
    this.auth = null;
    this.name = DEFAULT_NAME;
    this.odm = null;
    this.routes = null;
    this.waf = null;
    this.verbose = DEFAULT_VERBOSE;

    this._setup();
};

Restberry.prototype._setup = function() {
    this.auth = RestberryAuth;
    this.auth.restberry = this;
    this.routes = new RestberryRoute(null, this);
};

Restberry.prototype.config = function(config) {
    if (config.apiPath)  this.setApiPath(config.apiPath);
    if (config.name)  this.name = config.name;
    if (config.port)  this.setPort(config.port);
    this.verbose = config.verbose;
    return this;
};

Restberry.prototype.listen = function(name, port, next) {
    var self = this;
    _listenArgument(name, port, next, function(name, port, next) {
        if (name)  self.name = name;
        if (port)  self.waf.port = port;
        self.waf.listen(self.waf.port, function() {
            logger.info(self.name, self.waf.port);
            if (next)  next();
        });
    });
};

Restberry.prototype.model = function(name) {
    if (!this.odm)  throw new Error('Haven\'t specified any odm');
    return new RestberryModel(this.odm, name);
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
    module.restberry = self;
    if (module.__class__ === RestberryModules.waf) {
        self.waf = module;
        self.setApiPath(self.apiPath);
        self.setPort(self.port);
    } else if (module.__class__ === RestberryModules.odm) {
        self.odm = module;
    } else {
        throw new Error('Illegal module');
    }
    return self;
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
