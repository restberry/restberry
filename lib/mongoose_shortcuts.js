var _ = require('underscore');
var _s = require('underscore.string');

var config = require('../config/config.js');
var errors = require('./errors.js');
var utils = require('./utils.js');


var methods = {
    _isAuthorized: function(req, res, next) {
        next();
    },
    _populate: function(req, res, next) {
        errors.throwServerIssue(req, res, {name: 'Not Implemented'});
    },
    _toObject: function(next) {
        next(this.toObject());
    },
    removeAndVerify: function(req, res, next) {
        var self = this;
        self.isAuthorized(req, res, function() {
            self.remove(function(err) {
                if (err) {
                    errors.throwBadRequest(req, res, err);
                } else {
                    next();
                }
            });
        });
    },
    href: function(req) {
        var self = this;
        var pluralName = self.constructor.pluralName;
        return '/api/v1/' + pluralName + '/' + self.id;
    },
    saveAndVerify: function(req, res, next) {
        var self = this;
        self.isAuthorized(req, res, function() {
            self.save(function(err, obj) {
                if (err) {
                    err.objName = self.constructor.singleName;
                    errors.throwBadRequest(req, res, err);
                } else {
                    next(obj);
                }
            });
        });
    },
    toJSON: function(req, res, nested, next) {
        var self = this;
        self._populate(req, res, function(populatedObjs) {
            self._toObject(function(ret) {
                delete ret['__v'];
                var d = {
                    href: self.href(req),
                    id: ret['_id'],
                }
                if (_.contains(req.expand, self.constructor.singleName)) {
                    d = _applyFields(d, ret, req.fields, populatedObjs);
                }
                if (nested) {
                    var dd = {};
                    dd[self.constructor.singleName] = d;
                    d = dd;
                }
                next(d);
            });
        });
    },
    updateAndVerify: function(req, res, data, next) {
        var self = this;
        self.constructor.validateData(req, res, data, function() {
            self.constructor.isUnique(req, res, data, self._id, function() {
                self.update(req, res, data, function(obj) {
                    obj.timestampUpdated = new Date();
                    self.saveAndVerify(req, res, next);
                });
            });
        });
    },
    update: function(req, res, data, next) {
        errors.throwServerIssue(req, res, {name: 'Not Implemented'});
    },
    isAuthorized: function(req, res, next) {
        var self = this;
        self._isAuthorized(req, res, function(isAuthorized) {
            if (isAuthorized == null) {
                errors.throwServerIssue(req, res, {name: 'Not Implemented'});
            } else if (!isAuthorized) {
                errors.throwUnauthorized(req, res, {});
            } else {
                next();
            }
        });
    },
};

var statics = {
    _uneditableFields: function(req, res) {
        errors.throwServerIssue(req, res, {name: 'Not Implemented'});
    },
    createAndVerify: function(req, res, data, next) {
        var self = this;
        self.validateData(req, res, data, function() {
            self.isUnique(req, res, data, null, function() {
                var obj = new self(data);
                obj.saveAndVerify(req, res, next);
            });
        });
    },
    editableFields: function(req, res) {
        var fields = _extractFieldsFromSchema(this.schema);
        var virtuals = Object.keys(this.schema.virtuals);
        fields = _.union(fields, virtuals);
        var uneditableFields = this._uneditableFields(req, res);
        uneditableFields.push('id');
        return _.difference(fields, uneditableFields);
    },
    findAndVerify: function(req, res, query, next) {
        var self = this;
        var options = {
            skip: req.offset,
            limit: req.limit,
            sort: req.sort,
        }
        self.find(query, null, options, function(err, objs) {
            if (err) {
                errors.throwBadRequest(req, res, err);
            } else if (!objs || objs.length == 0) {
                next([]);
            } else {
                next(objs);
            }
        });
    },
    findByIdAndVerify: function(req, res, id, next) {
        var self = this;
        self.findById(id, function(err, obj) {
            var _notFound = function() {
                var err = {property: self.singleName};
                errors.throwNotFound(req, res, err);
            }
            if (err) {
                if (_s.include(err.message, 'Cast to ObjectId')) {
                    _notFound();
                } else {
                    errors.throwBadRequest(req, res, err);
                }
            } else if (!obj) {
                _notFound();
            } else {
                obj.isAuthorized(req, res, function() {
                    next(obj);
                });
            }
        });
    },
    findOneAndVerify: function(req, res, query, next) {
        var self = this;
        self.findOne(query, function(err, obj) {
            var _notFound = function() {
                var err = {property: self.singleName};
                errors.throwNotFound(req, res, err);
            }
            if (err) {
                errors.throwBadRequest(req, res, err);
            } else if (!obj) {
                _notFound();
            } else {
                obj.isAuthorized(req, res, function() {
                    next(obj);
                });
            }
        });
    },
    isUnique: function(req, res, data, ignoreId, next) {
        var self = this;
        self.uniqueData(req, res, data, function(query) {
            if (ignoreId)  query._id = {$ne: ignoreId};
            self.findAndVerify(req, res, query, function(objs) {
                if (objs.length > 0) {
                    var err = {
                        property: self.singleName,
                        obj: objs[0].id,
                    }
                    errors.throwConflict(req, res, err);
                } else {
                    next();
                }
            });
        });
    },
    pluralName: null,  // Not Implemented;
    setCountInHeader: function(res, query, next) {
        var self = this;
        self.count(query, function(err, c) {
            var key = self.singleName + '-count';
            res.set(config.headerPrefix + key, c);
            next(c);
        });
    },
    singleName: null,  // Not Implemented;
    toJSONs: function(req, res, objs, next) {
        var self = this;
        var key = self.pluralName;
        var json = {};
        var d = [];
        if (objs.length == 0) {
            json[key] = d;
            next(json);
        } else {
            _toJSONs(req, res, objs, [], function(d) {
                json[key] = d;
                next(json);
            });
        }
    },
    uniqueData: function(req, res, data, next) {
        errors.throwServerIssue(req, res, {name: 'Not Implemented'});
    },
    validateData: function(req, res, data, next) {
        var editableFields = this.editableFields(req, res);
        var dataFields = utils.getPaths(data);
        var illegalFields = _.difference(dataFields, editableFields);
        if (illegalFields.length) {
            var err = {
                name: errors.INVALID_INPUT_ERROR,
                modelName: this.singleName,
                property: illegalFields[0],
            }
            errors.throwBadRequest(req, res, err);
        } else if (req.method == 'PUT') {
            var missingFields = _.difference(editableFields, dataFields);
            if (missingFields.length) {
                var err = {
                    name: errors.MISSING_FIELD_ERROR,
                    objName: this.singleName,
                    property: missingFields[0],
                }
                errors.throwBadRequest(req, res, err);
            } else {
                next();
            }
        } else {
            next();
        }
    },
};

exports.methods = methods;
exports.statics = statics;

var _applyFields = function(d, ret, fields, populatedObjs) {
    if (!fields || fields.length == 0) {
        fields = _.without(Object.keys(ret), '_id');
    }
    for (i in fields) {
        var field = fields[i];
        var val = null;
        if (populatedObjs[field] != null) {
            val = populatedObjs[field];
        } else if (ret[field] != null) {
            val = ret[field];
        }
        d[field] = val;
    }
    return d;
};

var _extractFieldsFromSchema = function(schema) {
    var fields = [];
    var paths = Object.keys(schema.paths);
    for (i in paths) {
        var path = paths[i];
        var nestedSchema = schema.paths[path].schema;
        if (nestedSchema) {
            var nestedFields = _extractFieldsFromSchema(nestedSchema);
            for (i in nestedFields) {
                fields.push(path + '.0.' + nestedFields[i]);
            }
        } else if (schema.paths[path].caster) {
            fields.push(path + '.0');
        } else {
            fields.push(path);
        }
    }
    return _.without(fields, '_id', '__v');
};

var _toJSONs = function(req, res, objs, json, next) {
    var obj = objs[0];
    objs = objs.splice(1);
    obj.toJSON(req, res, false, function(j) {
        json.push(j);
        if (objs.length) {
            _toJSONs(req, res, objs, json, next);
        } else {
            next(json);
        }
    });
};
