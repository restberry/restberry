var _ = require('underscore');
var logger = require('restberry-logger');
var RestberryAuth = require('restberry-auth');
var RestberryORM = require('./orm');
var RestberryRoute = require('restberry-router');
var RestberryWeb = require('./web');
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
    this.orm = RestberryORM;
    this.orm.restberry = this;
    this.routes = new RestberryRoute(null, this);
    this.web = RestberryWeb;
    this.web.restberry = this;
};

Restberry.prototype.config = function(config) {
    if (config.apiPath)  this.web.apiPath = config.apiPath;
    if (config.name)  this.name = config.name;
    if (config.port)  this.web.port = config.port;
    this.verbose = config.verbose;
    return this;
};

module.exports = exports = new Restberry;
