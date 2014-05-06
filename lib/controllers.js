var _ = require('underscore');
var httpStatus = require('http-status');
var logger = require('./logger');

exports.read = function(req, res, m, next) {
    n.findByIdAndVerify(req, res, req.params.id, function(obj) {
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
    var findM = function(query) {
        m.findAndVerify(req, res, query, function(objs) {
            m.toJSONs(req, res, objs, function(json) {
                next(json);
            });
        });
    };
    if (n) {
        n.findByIdAndVerify(req, res, req.params.id, function(obj) {
            var d = [];
            d[n.singleName()] = obj._id;
            findM(d);
        })
    } else {
        findM({});
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
            data[n.singleName()] = obj.id;
            createM(data);
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
