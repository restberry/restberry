var _ = require('underscore');
var logger = require('restberry-logger');
var RestberryAuth = require('restberry-auth');
var RestberryModel = require('restberry-model');
var RestberryORMMongoose = require('restberry-orm-mongoose');
var RestberryRoute = require('restberry-router');
var RestberryWebExpress = require('restberry-web-express');
var utils = require('restberry-utils');


var DEFAULT_NAME = 'APP';
var DEFAULT_VERBOSE = false;

function Restberry() {
    this.auth = null;
    this.name = DEFAULT_NAME;
    this.orm = null;
    this.routes = null;
    this.web = null;
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
        if (port)  self.web.port = port;
        self.web.listen(self.web.port, function() {
            logger.info(self.name, self.web.port);
            if (next)  next();
        });
    });
};

Restberry.prototype.model = function(name) {
    if (!this.orm)  throw new Error('Haven\'t specified any ORM');
    return new RestberryModel(this.orm, name);
};

Restberry.prototype.setApiPath = function(apiPath) {
    if (this.web) {
        this.web.apiPath = apiPath;
        this.apiPath = null;
    } else {
        this.apiPath = apiPath;
    } 
};

Restberry.prototype.setPort = function(port) {
    if (this.web) {
        this.web.port = port;
        this.port = null;
    } else {
        this.port = port;
    } 
};

Restberry.prototype.useExpress = function(next) {
    var self = this;
    this.web = RestberryWebExpress
    this.setApiPath(this.apiPath);
    this.setPort(this.port);
    this.web.restberry = this;
    this.web.use(function(web) {
        web.app.use(function(req, res, next) {
            req.apiPath = web.apiPath;
            next();
        });
        if (next)  next(web);
    });
    return this;
};

Restberry.prototype.useMongoose = function(next) {
    var self = this;
    this.orm = RestberryORMMongoose
    this.orm.restberry = this;
    this.orm.use(next);
    return this;
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
