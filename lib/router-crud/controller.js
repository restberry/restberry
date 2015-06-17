var _ = require('underscore');
var errors = require('restberry-errors');
var httpStatus = require('http-status');
var logger = require('restberry-logger');
var utils = require('restberry-utils');


module.exports = {

    create: function() {
        var self = this;
        return function(req, res, next) {
            var done = function(json, obj) {
                var auth = self.restberry.auth;
                if (auth && auth.isUserModel(self.model)) {
                    req.logIn(obj, function(err) {
                        if (err) {
                            self.onError(errors.BadRequest, err);
                        } else {
                            logger.info('SESSION', 'login', obj.getId());
                            res._body = json;
                            next(json);
                        }
                    });
                } else {
                    res._body = json;
                    next(json);
                }
            };
            var create = function(data) {
                m = self.model;
                m.create(data, function(obj) {
                    obj.expandJSON();
                    obj.toJSON(function(json) {
                        res.status(httpStatus.CREATED);
                        done(json, obj);
                    });
                });
            };
            var data = _.clone(req.body);
            if (self.parentModel) {
                var pm = self.parentModel;
                pm.findById(req.params.id, function(obj) {
                    self.model.getFieldNameOfModel(pm, function(fieldName) {
                        data[fieldName] = obj.getId();
                        if (!data[fieldName]) {
                            var msg = 'There are no related fieldname in the ' +
                                      'model that matches the parent model';
                            var err = {message: msg};
                            self.onError(errors.ServerIssue, err);
                        } else {
                            create(data);
                        }
                    });
                });
            } else {
                create(data);
            }
        };
    },

    del: function() {
        var self = this;
        return function(req, res, next) {
            self.model.findById(req.params.id, function(obj) {
                obj.remove(function() {
                    res.status(httpStatus.NO_CONTENT);
                    res._body = {};
                    next({});
                });
            });
        };
    },

    read: function() {
        var self = this;
        return function(req, res, next) {
            var m = self.model;
            m.expandJSON();
            m.findById(req.params.id, function(obj) {
                obj.toJSON(function(json) {
                    res._body = json;
                    next(json);
                });
            });
        };
    },

    readMany: function() {
        var self = this;
        return function(req, res, next) {
            var readMany = function(query) {
                query = query || {};
                if (req._query) {
                    query = req._query;
                } else {
                    req._query = query;
                }
                var m = self.model;
                self.model.find(query, function(objs) {
                    objs.toJSON(function(json) {
                        self.model.hrefs(query, function(hrefs) {
                            json = _.extend(hrefs, json);
                            res._body = json;
                            next(json);
                        });
                    });
                });
            };
            if (self.parentModel) {
                var pm = self.parentModel;
                pm.findById(req.params.id, function(obj) {
                    self.model.getFieldNameOfModel(pm, function(fieldName) {
                        var query = {};
                        query[fieldName] = obj.getId();
                        readMany(query);
                    });
                });
            } else {
                readMany();
            }
        };
    },

    update: function() {
        var self = this;
        return function(req, res, next) {
            var m = self.model;
            m.findById(req.params.id, function(obj) {
                var data = _.clone(req.body);
                obj.update(data, function(obj) {
                    obj.expandJSON();
                    obj.toJSON(function(json) {
                        res._body = json;
                        next(json);
                    });
                });
            });
        }
    },

};
