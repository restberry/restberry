var _ = require('underscore');
var logger = require('restberry-logger');
var RestberryAuth = require('restberry-auth');
var RestberryExpress = require('restberry-express');
var RestberryModel = require('./model');
var RestberryMongoose = require('restberry-mongoose');
var utils = require('restberry-utils');


var DEFAULT_API_PATH = '';
var DEFAULT_NAME = 'APP';
var DEFAULT_PORT = 5000;

function Restberry() {
    this.apiPath = DEFAULT_API_PATH;
    this.auth = null;
    this.connections = {
        db: null,
        web: null,
    };
    this.name = DEFAULT_NAME;
    this.port = DEFAULT_PORT;
};

Restberry.prototype.apply = function() {
};

Restberry.prototype.config = function(config) {
    if (config.apiPath)  this.apiPath = config.apiPath;
    return this;
};

Restberry.prototype.useExpress = function(next) {
    var self = this;
    RestberryExpress.use(self, function(app) {
        app.use(function(req, res, next) {
            req.apiPath = self.apiPath;
            next();
        });
        next(app);
    });
    return self;
};

Restberry.prototype.useMongoose = function(next) {
    var self = this;
    RestberryMongoose.use(self, function(mongoose) {
        next(mongoose);
        self.auth = new RestberryAuth(self);
    });
    return self;
};

Restberry.prototype.listen = function(a, b, c) {
    var self = this;
    var next;
    if (a) {
        if (_.isFunction(a)) {
            next = a;
        } else if (_.isNumber(a)) {
            self.port = a;
        } else {
            self.name = a;
        }
    }
    if (b) {
        if (_.isFunction(b)) {
            next = b;
        } else if (_.isNumber(b)) {
            self.port = b;
        }
    }
    if (c && _.isFunction(c)) {
        next = c;
    }
    self.connections.web.listen(self.port, function() {
        logger.info(self.name, self.port);
        if (next)  next();
    });
};

Restberry.prototype.model = function(name) {
    var model = new RestberryModel(name, this.connections);
    if (model.routes)  model.routes.apiPath = this.apiPath;
    return model;
};

module.exports = exports = new Restberry;
