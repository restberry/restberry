var httpMethod = require('./http-method');


var DEFAULT_ACTIONS = false;
var DEFAULT_API_PATH = '';
var DEFAULT_CONTROLLER = function() { };
var DEFAULT_ENABLE_AUTHENTICATION = false;
var DEFAULT_METHOD = 'GET';
var DEFAULT_PATH = null;
var DEFAULT_POST_ACTION = function(json, req, res, next) { next(json); };
var DEFAULT_PRE_ACTION = function(req, res, next) { next(); };
var DEFAULT_VERBOOSE = false;

function Route(router, model) {
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
    this.route = router;
    this.verbose = DEFAULT_VERBOOSE;
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

Route.prototype.apply = function(web) {
    if (this.controller)  this.controller();
    if (!this.action)  return;
    if (!this.path)  this.generatePath();
    if (this.verbose)  console.log(this.method, this.path)
    switch (this.method) {
        case httpMethod.DELETE:
            web.app.del(this.path, this.preReq, web.handleReq,
                        this.preAction, this.action, this.postAction,
                        web.handleRes);
        case httpMethod.GET:
            web.app.get(this.path, this.preReq, web.handleReq,
                        this.preAction, this.action, this.postAction,
                        web.handleRes);
        case httpMethod.POST:
            web.app.post(this.path, this.preReq, web.handleReq,
                         this.preAction, this.action, this.postAction,
                         web.handleRes);
        case httpMethod.PUT:
            web.app.put(this.path, this.preReq, web.handleReq,
                        this.preAction, this.action, this.postAction,
                        web.handleRes);
    }
    return this;
};

module.exports = exports = Route;
