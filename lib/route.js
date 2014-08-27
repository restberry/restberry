var controller = require('./controller');

var DEFAULT_ACTIONS = false;
var DEFAULT_API_PATH = '';
var DEFAULT_CONTROLLER = function() { };
var DEFAULT_ENABLE_AUTHENTICATION = false;
var DEFAULT_METHOD = 'GET';
var DEFAULT_PATH = null;
var DEFAULT_POST_ACTION = function(json, req, res, next) { next(json); };
var DEFAULT_PRE_ACTION = function(req, res, next) { next(); };
var DEFAULT_VERBOOSE = false;
var HTTP_METHOD_DELETE = 'DELETE';
var HTTP_METHOD_GET = 'GET';
var HTTP_METHOD_POST = 'POST';
var HTTP_METHOD_PUT = 'PUT';

function Route(web, model) {
    this.action = null;
    this.actions = DEFAULT_ACTIONS;
    this.apiPath = DEFAULT_API_PATH;
    this.controller = DEFAULT_CONTROLLER;
    this.enableAuthentication = DEFAULT_ENABLE_AUTHENTICATION;
    this.method = DEFAULT_METHOD;
    this.models = {
        self: model,
        parent: null,
    };
    this.path = DEFAULT_PATH;
    this.postAction = DEFAULT_POST_ACTION;
    this.preAction = DEFAULT_PRE_ACTION;
    this.preReq = DEFAULT_PRE_ACTION;
    this.verbose = DEFAULT_VERBOOSE;
    this.web = web;
};

Route.prototype.config = function(config) {
    this.models.parent = config.parentModel;
    this.verbose = config.verbose;
    if (config.apiPath)  this.apiPath = config.apiPath;
    if (config.action)  this.action = config.action;
    if (config.controller)  this.controller = config.controller;
    if (config.method)  this.method = config.method;
    return this;
};

Route.prototype.addCreate = function(config) {
    if (!config)  config = {};
    config.controller = controller.create;
    config.method = HTTP_METHOD_POST;
    return this.addCustom(config);
};

Route.prototype.addCustom = function(config) {
    if (!config)  config = {};
    config.apiPath = this.apiPath;
    return new Route(this.web, this.models.self)
        .config(config)
        .apply();
};

Route.prototype.addReadMany = function(config) {
    if (!config)  config = {};
    config.controller = controller.readMany;
    config.method = HTTP_METHOD_GET;
    return this.addCustom(config);
};

Route.prototype.addAction = function(value, action, config) {
    return this;
};

Route.prototype.generatePath = function() {
    var path = DEFAULT_PATH;
    if (this.models.parent) {
        path = this.apiPath + '/' + this.models.parent.pluralName() + '/:id';
        if (this.models.self)  path += '/' + this.models.self.pluralName();
    } else if (this.models.self) {
        path = this.apiPath + '/' + this.models.self.pluralName();
    }
    this.path = path;
};

Route.prototype.handleActions = function(req, res, next) {
    if (req.query.action && this.actions) {
        var action = this.actions[req.query.action];
        if (action) {
            action(req, res, next);
        } else {
            var err = {message: 'Illegal action'};
            errors.throwBadRequest(req, res, err);
        }
    } else {
       this.action(next);
    }
};

Route.prototype.apply = function() {
    if (this.controller)  this.controller();
    if (!this.action)  return;
    if (!this.path)  this.generatePath();
    if (this.verbose)  console.log(this.method, this.path)
    switch (this.method) {
        case HTTP_METHOD_DELETE:
            this.web.app.del(this.path, this.preReq, this.web.handleReq,
                             this.preAction, this.action, this.postAction,
                             this.web.handleRes);
        case HTTP_METHOD_GET:
            this.web.app.get(this.path, this.preReq, this.web.handleReq,
                             this.preAction, this.action, this.postAction,
                             this.web.handleRes);
        case HTTP_METHOD_POST:
            this.web.app.post(this.path, this.preReq, this.web.handleReq,
                              this.preAction, this.action, this.postAction,
                              this.web.handleRes);
        case HTTP_METHOD_PUT:
            this.web.app.put(this.path, this.preReq, this.web.handleReq,
                             this.preAction, this.action, this.postAction,
                             this.web.handleRes);
    }
    return this;
};

module.exports = exports = Route;
