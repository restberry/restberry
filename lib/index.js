var _ = require('underscore');
var RestberryModel = require('./model');
var rExpress = require('restberry-express');
var rLogger = require('restberry-logger');
var rMongoose = require('restberry-mongoose');
var rUtils = require('restberry-utils');


var DEFAULT_API_PATH = '';
var DEFAULT_NAME = 'APP';
var DEFAULT_PORT = 5000;

function Restberry() {
    this.apiPath = DEFAULT_API_PATH;
    this.auth = {
        model: null,
        google: null,
    };
    this.connections = {
        db: null,
        web: null,
    };
    this.name = DEFAULT_NAME;
    this.port = DEFAULT_PORT;
};

Restberry.prototype.config = function(config) {
    if (config.apiPath)  this.apiPath = config.apiPath;
    return this;
},

Restberry.prototype.useExpress = function(next) {
    rExpress.use(this, next);
    return this;
};

Restberry.prototype.useMongoose = function(next) {
    rMongoose.use(this, next);
    return this;
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
        rLogger.info(self.name, self.port);
    });
};

Restberry.prototype.model = function(name) {
    var model = new RestberryModel(name, this.connections);
    if (model.route)  model.routes.apiPath = this.apiPath;
    return model;
};

module.exports = exports = new Restberry;
