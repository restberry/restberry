var _ = require('underscore');
var logger = require('restberry-logger');
var RestberryExpress = require('restberry-express');


var DEFAULT_API_PATH = '';
var DEFAULT_PORT = 5000;

function RestberryWeb() {
    this.apiPath = DEFAULT_API_PATH;
    this.port = DEFAULT_PORT;
    this.restberry = null;
};

RestberryWeb.prototype.listen = function(a, b, c) {
    var self = this;
    _listenArgument(a, b, c, function(name, port, next) {
        if (name)  self.restberry.name = name;
        if (port)  self.port = port;
        self._listen(self.port, function() {
            logger.info(self.restberry.name, self.port);
            if (next)  next();
        });
    });
};

RestberryWeb.prototype.use = function(web, next) {
    var self = this;
    // vars
    web.apiPath = this.apiPath;
    web.port = this.port;
    web.restberry = this.restberry;
    // methods
    web.listen = this.listen;
    // set
    this.restberry.web = web;
    // use
    web.use(function(web) {
        var app = web.app;
        app.use(function(req, res, next) {
            req.apiPath = self.apiPath;
            next();
        });
        if (next)  next(web);
    });
    return this.restberry;
};

RestberryWeb.prototype.useExpress = function(next) {
    return this.use(RestberryExpress, next);
};

module.exports = exports = new RestberryWeb;

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
