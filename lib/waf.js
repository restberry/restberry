var _ = require('underscore');
var errors = require('restberry-errors');
var logger = require('restberry-logger');
var httpStatus = require('http-status');
var RestberryOptions = require('./options');
var utils = require('restberry-utils');

var DEFAULT_API_PATH = '';
var DEFAULT_PORT = 5000;
var HEADER_CONTENT_TYPE_KEY = 'Content-Type';
var HEADER_CONTENT_TYPE_JSON = 'application/json';
var ERROR_TYPE = 'ERROR';

function RestberryWAF(module) {
    this.apiPath = DEFAULT_API_PATH;
    this.port = DEFAULT_PORT;
    _.extend(this, module);
};

RestberryWAF.prototype.getReq = function() {
    var req = this._req;
    if (_.isUndefined(req)) {
        // NOTE(materik):
        // * this is probably because the call is done outside a request
        return;
    }
    return {
        data: req.body,
        method: req.method,
        path: utils.getReqPath(req),
    };
};

RestberryWAF.prototype.getUser = function() {
    return this._req.user;
};

RestberryWAF.prototype.handleRes = function(json, req, res, next) {
    if (json._readableState) {
        next = res;
        res = req;
        req = json;
        json = res._body;
    }
    var waf = req._waf;
    if (!waf) {
        throw json;
    }
    waf.setReqAndRes(req, res);
    if (!json || !_.isObject(json)) {
        waf.onError(errors.InternalServerError, json);
    } else if (json.constructor == TypeError ||
               json.constructor == ReferenceError) {
        json = {message: json.toString()};
        waf.onError(errors.InternalServerError, json);
    } else if (json.constructor == Error) {
        waf.onError(errors.BadRequest, json);
    } else {
        var code = res.statusCode;
        if (json.error)  code = json.error.statusCode;
        var data = (code === httpStatus.NO_CONTENT ? undefined : json);
        if (!waf._res._headerSent) {
            waf.res(code, data);
            logger.res(res, data);
        }
    }
};

RestberryWAF.prototype.handleReq = function(req, res, next) {
    logger.req(req);
    if (req.isLoginRequired && !req.user) {
        RestberryWAF.onError(req, res, errors.Unauthenticated);
    } else {
        res.status(httpStatus.OK);
        next();
    }
};

RestberryWAF.prototype.onError = function(error, err, next) {
    var self = this;
    err = err || {};
    err.req = self.getReq();
    if (_.isUndefined(err.req)) {
        // NOTE(materik):
        // * this probably means that the call is done outside a request
        return;
    }
    error(err, function(err) {
        if (next) {
            next(err);
        } else {
            self.handleRes(err, self._req, self._res);
        }
    });
};

RestberryWAF.prototype.options = function(req) {
    req = req || this._req;
    return new RestberryOptions(req);
};

RestberryWAF.prototype.setReqAndRes = function(req, res) {
    this._req = req, this._res = res;
    this._options = undefined;
    if (this._req && this._req.set) {
        this._req.set(HEADER_CONTENT_TYPE_KEY, HEADER_CONTENT_TYPE_JSON);
    }
};

RestberryWAF.prototype.setRestberry = function(restberry) {
    this.restberry = restberry;
};

RestberryWAF.canApply = function(waf) {
    return _.isFunction(waf.delete) &&
           _.isFunction(waf.get) &&
           _.isFunction(waf.listen) &&
           _.isFunction(waf.post) &&
           _.isFunction(waf.put) &&
           _.isFunction(waf.res) &&
           _.isFunction(waf.use);
};

RestberryWAF.onError = function(req, res, error, err, next) {
    var waf = req._waf;
    if (!waf) {
        throw err;
    }
    waf.setReqAndRes(req, res);
    waf.onError(error, err, next);
};

module.exports = exports = RestberryWAF;
