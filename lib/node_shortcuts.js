var _ = require('underscore');
var _s = require('underscore.string');
var errors = require('./errors.js');
var httpStatus = require('http-status');
var logger = require('./logger.js');
var utils = require('./utils.js');


var getReqPath = function(req) {
    var path = req.url;
    path = path.replace(':id', req.params.id);
    return path;
};

var paginationInfo = function(req, res, href, max) {
    var min = 0;
    var limit = parseInt(req.limit);
    var offset = parseInt(req.offset);
    var lastOffset = limit;
    while (lastOffset < max) {
        lastOffset += limit;
    };
    lastOffset -= limit;
    var nextOffset = offset + limit;
    var prevOffset = offset - limit;
    var current = href + '?offset=' + offset + '&limit=' + limit;
    var next = null;
    var prev = null;
    var first = href + '?offset=' + min + '&limit=' + limit;
    var last = href + '?offset=' + lastOffset + '&limit=' + limit;
    if (first == last) {
        first = null;
        last = null;
    } else {
        if (nextOffset < max) {
            next = href + '?offset=' + nextOffset + '&limit=' + limit;
        };
        if (prevOffset >= min) {
            prev = href + '?offset=' + prevOffset + '&limit=' + limit;
        };
    };
    if (!next)  last = null;
    if (!prev)  first = null;
    return {
        hrefs: {
            current: current,
            first: first,
            last: last,
            next: next,
            prev: prev,
        },
        offset: offset,
        limit: limit,
    };
};

var handleRes = function(json, req, res, next) {
    var code = res.statusCode;
    if (!json || !utils.isDict(json)) {
        errors.throwServerIssue(req, res, json);
    } else if (json.type == 'ERROR') {
        errors.throwBadRequest(req, res, json);
    } else {
        var data = (code == httpStatus.NO_CONTENT ? null : json);
        res.json(code, data);
        logger.response(res, data);
    };
};

var handleReq = function(req, res, auth, next) {
    logger.request(req);
    req.auth = auth;
    if (auth && !req.user) {
        errors.throwUnauthenticated(req, res, {});
    } else {
        _setQueries(req);
        res.status(httpStatus.OK);
        next();
    };
};

// ----- Exports -----;

exports.getReqPath = getReqPath;
exports.paginationInfo = paginationInfo;
exports.handleReq = handleReq;
exports.handleRes = handleRes;

// ----- Helper -----;

var _setQueries = function(req) {
    _setExpand(req);
    _setFields(req);
    _setSort(req);
    _setOffsetAndLimit(req);
};

var _setExpand = function(req) {
    var query = req.query;
    req.expand = (query.expand ? query.expand.split(',') : []);
};

var _setFields = function(req) {
    var query = req.query;
    req.fields = (query.fields ? query.fields.split(',') : []);
};

var _setSort = function(req) {
    var query = req.query;
    var sort = {timestampCreated: -1};
    if (query.sort) {
        sort = {};
        var sorts = query.sort.split(',');
        for (i in sorts) {
            var reqSort = sorts[i];
            if (_s.startsWith(reqSort, '-')) {
                reqSort = _s.splice(reqSort, 0, 1);
                sort[reqSort] = -1;
            } else {
                sort[reqSort] = 1;
            };
        };
    };
    req.sort = sort;
};

var _setOffsetAndLimit = function(req) {
    var query = req.query;
    req.offset = (query.offset ? query.offset : 0);
    req.limit = (query.limit ? query.limit : 12);
};
