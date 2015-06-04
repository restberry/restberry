var _ = require('underscore');
var errors = require('restberry-errors');
var logger = require('restberry-logger');
var path = require('path');
var util = require('util');
var utils = require('restberry-utils');

var DEFAULT_API_PATH = '';
var DEFAULT_CONTROLLER = null;
var DEFAULT_METHOD = 'GET';
var DEFAULT_PATH = null;
var DEFAULT_POST_ACTION = function(json, req, res, next) {
    if (json._readableState) {
        next = res;
        res = req;
        req = json;
        json = res._body;
    }
    next(json);
};
var DEFAULT_PRE_ACTION = function(req, res, next) { next(); };
var DEFAULT_SINGLE = false;
var DEFAULT_VERBOOSE = false;
var PATH_ID = ':id';
var PATH_ROOT = '/';
var ROUTE_PLURAL_METHOD_FORMAT = 'add%sRoutes'
var ROUTE_SINGULAR_METHOD_FORMAT = 'add%sRoute'

function Route(model, restberry) {
    this._controller = DEFAULT_CONTROLLER;
    this._single = DEFAULT_SINGLE;
    this._routes = [];

    this.apiPath = DEFAULT_API_PATH;
    this.action = null;
    this.actions = null;
    this.isLoginRequired = (model ? model.isLoginRequired() : false);
    this.method = DEFAULT_METHOD;
    this.model = model;
    this.parentModel = null;
    this.path = DEFAULT_PATH;
    this.postAction = DEFAULT_POST_ACTION;
    this.preAction = DEFAULT_PRE_ACTION;
    this.restberry = restberry || (model ? model.restberry : null);
    this.verbose = DEFAULT_VERBOOSE;
};

Route.prototype._applyController = function() {
    var self = this;
    self.action = function(req, res, next) {
        var action;
        if (req.query.action) {
            var action = self.actions ? self.actions[req.query.action] : null;
            if (!action) {
                var actions = _.keys(self.actions) || [];
                var err = {
                    message: 'Illegal action=' + req.query.action +
                             ', possible: [' + actions + ']',
                };
                self.onError(errors.BadRequest, err);
            }
        } else {
            action = self._controller();
        }
        if (action)  action(req, res, next);
    };
};

Route.prototype._toJSON = function() {
    return {
        method: this.method,
        path: this.apiPath + this.path,
        body: {
            isLoginRequired: this.isLoginRequired,
            actions: (this.actions ? _.keys(this.actions) : null),
        },
    };
};

Route.prototype.addCustomRoute = function(config) {
    if (!config)  config = {};
    config.apiPath = config.apiPath || this.restberry.waf.apiPath;
    return this.copy(this.model).config(config).apply();
};

Route.prototype.apply = function() {
    var self = this;
    if (this._controller)  this._applyController();
    if (!this.action)  return;
    if (!this.path)  this.generatePath();
    if (this.verbose)  logger.req(this._toJSON());
    var waf = this.restberry.waf;
    var path = this.apiPath + this.path;
    var postRes = this.postRes();
    var preReq = this.preReq();
    switch (this.method) {
        case utils.httpMethod.DELETE:
            waf.delete(path, preReq, waf.handleReq, this.preAction,
                       this.action, this.postAction, waf.handleRes,
                       postRes);
            break;
        case utils.httpMethod.GET:
            waf.get(path, preReq, waf.handleReq, this.preAction,
                    this.action, this.postAction, waf.handleRes,
                    postRes);
            break;
        case utils.httpMethod.POST:
            waf.post(path, preReq, waf.handleReq, this.preAction,
                     this.action, this.postAction, waf.handleRes,
                     postRes);
            break;
        case utils.httpMethod.PUT:
            waf.put(path, preReq, waf.handleReq, this.preAction,
                    this.action, this.postAction, waf.handleRes,
                    postRes);
            break;
    }
    return this;
};

Route.prototype.config = function(config) {
    this.parentModel = config.parentModel;
    if (_.isString(this.parentModel)) {
        this.parentModel = this.restberry.model(this.parentModel);
    }
    this._single = config._single;
    this.verbose = config.verbose || this.restberry.verbose;
    if (this._single)  this.parentModel = null;
    if (config._controller)  this._controller = config._controller;
    if (config.apiPath)  this.apiPath = config.apiPath;
    if (config.action)  this.action = config.action;
    if (config.actions)  this.actions = config.actions;
    if (config.method)  this.method = config.method;
    if (config.isLoginRequired !== undefined) {
        this.isLoginRequired = config.isLoginRequired;
    }
    if (config.path)  this.path = config.path;
    if (config.preAction)  this.preAction = config.preAction;
    if (config.postAction)  this.postAction = config.postAction;
    return this;
};

Route.prototype.copy = function(model) {
    model = model || this.model;
    var routes = new Route(model, this.restberry);
    _.each(this._routes, function(route) {
        routes.use(route);
    });
    return routes;
};

Route.prototype.generatePath = function() {
    var p = DEFAULT_PATH;
    if (this.model) {
        if (this.parentModel) {
            p = path.join(PATH_ROOT, this.parentModel.pluralName(), PATH_ID);
            p = path.join(p, this.model.pluralName());
        } else {
            p = path.join(PATH_ROOT, this.model.pluralName());
            if (this._single)  p = path.join(p, PATH_ID);
        }
    }
    this.path = p;
};

Route.prototype.onError = function(error, err, next) {
    err = err || {};
    this.restberry.onError(error, err, next);
};

Route.prototype.postRes = function() {
    var waf = this.restberry.waf;
    return function(json, req, res, next) {
        waf.setReqAndRes();
        next(json);
    };
};

Route.prototype.preReq = function() {
    var self = this;
    var waf = this.restberry.waf;
    return function(req, res, next) {
        waf.setReqAndRes(req, res);
        var options = waf.options(req);
        self.model = self.model && self.model.setOptions(options);
        self.parentModel = self.parentModel && self.parentModel.setOptions(options);
        req.isLoginRequired = self.isLoginRequired;
        req._waf = self.restberry.waf.constructor;
        next();
    };
};

Route.prototype.use = function(routes) {
    var self = this;
    var routeNames = _.keys(routes);
    _.each(routeNames, function(routeName) {
        var route = routes[routeName];
        var format;
        if (route.isPlural) {
            format = ROUTE_PLURAL_METHOD_FORMAT;
        } else {
            format = ROUTE_SINGULAR_METHOD_FORMAT;
        }
        var methodName = util.format(format, routeName);
        self[methodName] = route.method;
    });
    self._routes.push(routes);
};

module.exports = exports = Route;
