var _ = require('underscore');
var httpStatus = require('http-status');
var logger = require('http-color-logger');
var ns = require('./node_shortcuts');


exports.read = function(req, res, m, next) {
    req.expand.push(m.singleName());
    m.findByIdAndVerify(req, res, req.params.id, function(obj) {
        obj.toJSON(req, res, true, function(json) {
            next(json);
        });
    })
};

exports.del = function(req, res, m, next) {
    m.findByIdAndVerify(req, res, req.params.id, function(obj) {
        obj.removeAndVerify(req, res, function() {
            res.status(httpStatus.NO_CONTENT);
            next({});
        });
    });
};

exports.readMany = function(req, res, m, n, next) {
    var findM = function(parentObj) {
        var query = {};
        if (parentObj)  query[n.singleName()] = parentObj._id;
        m.findAndVerify(req, res, query, function(objs) {
            m.countAndVerify(req, res, query, function(c) {
                m.toJSONs(req, res, objs, function(json) {
                    var href = (parentObj ? parentObj.href(req, m) : m.href(req));
                    var pag = ns.paginationInfo(req, res, href, c);
                    json = _.extend(pag, json);
                    next(json);
                });
            });
        });
    };
    if (n) {
        n.findByIdAndVerify(req, res, req.params.id, findM);
    } else {
        findM(null);
    }
};

exports.create = function(req, res, m, n, next) {
    var createM = function(data) {
        req.expand.push(m.singleName());
        m.createAndVerify(req, res, data, function(obj) {
            obj.toJSON(req, res, true, function(json) {
                res.status(httpStatus.CREATED);
                next(json);
            });
        });
    };
    var data = _.clone(req.body);
    if (n) {
        n.findByIdAndVerify(req, res, req.params.id, function(obj) {
            m.getFieldNameOfModel(n, function(fieldName, isArray, iter) {
                if ((!fieldName || isArray) && iter) {
                    iter();
                    return;
                } else if (fieldName) {
                    data[fieldName] = obj.id;
                }
                createM(data);
            });
        });
    } else {
        createM(data);
    }
};

exports.login = function(req, res, next) {
    logger.log('SESSION', 'login', req.user._id);
    req.user.timestampLastLogIn = new Date();
    req.user.saveAndVerify(req, res, function(user) {
        req.expand.push(user.constructor.singleName());
        user.toJSON(req, res, true, function(json) {
            next(json);
        });
    });
};

exports.logout = function(req, res, next) {
    logger.log('SESSION', 'logout', req.user._id);
    req.logout();
    res.status(httpStatus.NO_CONTENT);
    next({});
};