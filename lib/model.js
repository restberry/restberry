var _ = require('underscore');
var errors = require('restberry-errors');
var path = require('path').posix;
var qs = require('qs');
var RestberryObj = require('./obj');
var RestberryObjs = require('./objs');
var utils = require('restberry-utils');

var DEFAULT_NEED_AUTHENTICATION = false;
var QS_START = '?';

function RestberryModel(restberry, name) {
    this._loginRequired = DEFAULT_NEED_AUTHENTICATION;
    this._methods = {};
    this._model = null;
    this._options = null;
    this._schema = null;
    this._statics = {};

    this.name = name;
    this.restberry = restberry;
    this.routes = null;

    this._setup();
}

RestberryModel.prototype._create = function(data) {
    return new RestberryObj(this, data);
};

RestberryModel.prototype._find = function(query, options, next) {
    this.restberry.odm.find(this._model, query, options, next);
};

RestberryModel.prototype._findById = function(id, next) {
    this.restberry.odm.findById(this._model, id, next);
};

RestberryModel.prototype._findOne = function(query, next) {
    this.restberry.odm.findOne(this._model, query, next);
};

RestberryModel.prototype._setup = function() {
    if (!this.restberry.odm) {
        throw new Error('ODM hasn\'t been set');
    }
    this._model = this.restberry.odm.get(this.name);
    this._setupRoutes();
};

RestberryModel.prototype._setupRoutes = function() {
    if (this._model) {
        this.routes = this.restberry.routes.copy(this);
    }
};

RestberryModel.prototype.copy = function() {
    var model = new RestberryModel(this.restberry, this.name);
    model = model.statics(this._statics);
    model = model.methods(this._methods);
    model._loginRequired = this._loginRequired;
    if (this._options) {
        model._options = this._options.copy();
    }
    return model;
};

RestberryModel.prototype.count = function(query, next, onError) {
    var self = this;
    self._find(query, {}, function(err, objs) {
        next(objs && objs.length || 0);
    }, onError);
};

RestberryModel.prototype.create = function(data, next, onError) {
    var self = this;
    self.validate(data, function() {
        var obj = self._create(data);
        obj.save(next, onError);
    }, onError);
};

RestberryModel.prototype.expandJSON = function() {
    this.options().addExpand(this.singularName());
};

RestberryModel.prototype.find = function(query, next, onError) {
    var self = this;
    var options = self.options();
    self._find(query, options, function(err, _objs) {
        if (err) {
            self.onError(errors.BadRequest, err, onError);
        } else {
            next(RestberryObjs.objs(self, _objs));
        }
    });
};

RestberryModel.prototype.findById = function(id, next, onError) {
    var self = this;
    self._findById(id, function(err, _obj) {
        var _notFound = function() {
            var err = {property: self.singularName()};
            self.onError(errors.NotFound, err, onError);
        };
        if (err) {
            if (self.restberry.odm.isNotFoundError(err)) {
                _notFound();
            } else {
                self.onError(errors.BadRequest, err, onError);
            }
        } else if (!_obj) {
            _notFound();
        } else {
            var obj = self.obj(_obj);
            next(obj);
        }
    });
};

RestberryModel.prototype.findOne = function(query, next, onError) {
    var self = this;
    self._findOne(query, function(err, _obj) {
        if (err) {
            self.onError(errors.BadRequest, err, onError);
        } else if (!_obj) {
            err = {property: self.singularName()};
            self.onError(errors.NotFound, err, onError);
        } else {
            var obj = self.obj(_obj);
            obj.isAuthorized(function() {
                next(obj);
            }, onError);
        }
    });
};

RestberryModel.prototype.getFieldNamesAll = function() {
    return this.restberry.odm.getFieldNamesAll(this._model);
};

RestberryModel.prototype.getFieldNamesEditable = function() {
    return this.restberry.odm.getFieldNamesEditable(this._model);
};

RestberryModel.prototype.getFieldNamesExpand = function() {
    return this.options().expand;
};

RestberryModel.prototype.getFieldNamesHidden = function() {
    return this.restberry.odm.getFieldNamesHidden(this._model);
};

RestberryModel.prototype.getFieldNamesVisible = function(fieldName) {
    var options = this.options();
    var fields = _.clone(options.fields) || [];
    if (!fields.length && this.shouldOutputExpand(fieldName)) {
        var _fields = this.getFieldNamesAll();
        _.each(_fields, function(field) {
            fields.push(_.first(field.split('.')));
        });
    }
    fields = _.difference(fields, this.getFieldNamesHidden());
    fields = _.uniq(fields);
    return fields;
};

RestberryModel.prototype.getFieldsOfModels = function(next) {
    this.restberry.odm.getFieldsOfModels(this._model, next);
};

RestberryModel.prototype.getFieldNamesOfModel = function(model, next) {
    this.getFieldsOfModels(function(fields) {
        fields = _.filter(fields, function(field) {
            return model.name === field.model.name;
        });
        fieldNames = _.pluck(fields, 'fieldName');
        next(fieldNames);
    });
};

RestberryModel.prototype.getFieldNameOfModel = function(model, next) {
    this.getFieldsOfModels(function(fields) {
        fields = _.filter(fields, function(field) {
            return !field.isArray;
        });
        fieldName = _.first(_.pluck(fields, 'fieldName'));
        next(fieldName);
    });
};

RestberryModel.prototype.href = function() {
    if (!this.restberry.waf) {
        return '';
    }
    var apiPath = this.restberry.waf.apiPath;
    var pluralName = this.pluralName();
    return path.join(apiPath, pluralName);
};

RestberryModel.prototype.hrefs = function(query, next) {
    var href = this.href();
    var options = this.options();
    this.count(query, function(total) {
        var hrefNext = null;
        var hrefPrev = null;
        var limit = parseInt(options.limit);
        var pages = Math.ceil(total / limit);
        var offset = parseInt(options.offset);
        var offsetFirst = 0;
        var offsetLast = limit * (pages - 1);
        var offsetNext = offset + limit;
        var offsetPrev = offset - limit;
        var hrefCurrent = _appendQsOffsetAndLimit(href, offset, limit);
        var hrefFirst = _appendQsOffsetAndLimit(href, offsetFirst, limit);
        var hrefLast = _appendQsOffsetAndLimit(href, offsetLast, limit);
        if (hrefCurrent == hrefFirst) {
            hrefFirst = null;
        }
        if (hrefCurrent == hrefLast) {
            hrefLast = null;
        }
        if (offsetNext <= offsetLast) {
            hrefNext = _appendQsOffsetAndLimit(href, offsetNext, limit);
        }
        if (offsetPrev >= offsetFirst) {
            hrefPrev = _appendQsOffsetAndLimit(href, offsetPrev, limit);
        } else if (hrefFirst) {
            hrefPrev = hrefFirst;
        }
        next({
            hrefs: {
                current: hrefCurrent,
                first: hrefFirst,
                next: hrefNext,
                prev: hrefPrev,
                last: hrefLast,
            },
            offset: offset,
            limit: limit,
            total: total,
        });
    });
};

RestberryModel.prototype.isAuthorized = function(m) {
    this._methods._isAuthorized = m;
    return this;
};

RestberryModel.prototype.isAuthorizedToCreate = function(m) {
    this._methods._isAuthorizedToCreate = m;
    return this;
};

RestberryModel.prototype.isAuthorizedToDelete = function(m) {
    this._methods._isAuthorizedToDelete = m;
    return this;
};

RestberryModel.prototype.isAuthorizedToRead = function(m) {
    this._methods._isAuthorizedToRead = m;
    return this;
};

RestberryModel.prototype.isAuthorizedToUpdate = function(m) {
    this._methods._isAuthorizedToUpdate = m;
    return this;
};

RestberryModel.prototype.isLoginRequired = function() {
    return this._loginRequired;
};

RestberryModel.prototype.loginRequired = function() {
    this._loginRequired = true;
    return this;
};

RestberryModel.prototype.methods = function(methods) {
    this._methods = _.extend(this._methods, methods);
    return this;
};

RestberryModel.prototype.obj = function(_obj) {
    return RestberryObj.obj(this, _obj);
};

RestberryModel.prototype.onError = function(error, err, next) {
    err = err || {};
    err.modelName = this.singularName();
    this.restberry.onError(error, err, next);
};

RestberryModel.prototype.options = function() {
    if (!this.restberry.waf) {
        return {};
    }
    if (!this._options) {
        this._options = this.restberry.waf.options();
    }
    delete this._options._req;
    return this._options;
};

RestberryModel.prototype.pluralName = function() {
    return this.restberry.odm.pluralName(this._model);
};

RestberryModel.prototype.populate = function(populate) {
    this._methods._populate = populate;
    return this;
};

RestberryModel.prototype.preRemove = function(preRemove) {
    if (!_.isArray(this._methods._preRemove)) {
        this._methods._preRemove = [];
    }
    this._methods._preRemove.push(preRemove);
    return this;
};

RestberryModel.prototype.preSave = function(preSave) {
    if (!_.isArray(this._methods._preSave)) {
        this._methods._preSave = [];
    }
    this._methods._preSave.push(preSave);
    return this;
};

RestberryModel.prototype.schema = function(schema) {
    if (!this.restberry.odm) {
        throw new Error('ODM hasn\'t been set');
    }
    if (this._schema || this._model) {
        throw new Error('Schema has already been set');
    }
    this._schema = this.restberry.odm.schema(schema);
    this._model = this.restberry.odm.set(this.name, this._schema);
    this._setupRoutes();
    return this;
};

RestberryModel.prototype.setOptions = function(options) {
    var model = this.copy();
    var wafOptions = this.restberry.waf && this.restberry.waf.options() || {};
    model._options = options || wafOptions;
    return model;
};

RestberryModel.prototype.shouldOutputExpand = function(fieldName) {
    expand = this.getFieldNamesExpand();
    fieldName = fieldName || this.singularName();
    return _.contains(expand, fieldName);
};

RestberryModel.prototype.singularName = function() {
    return this.restberry.odm.singularName(this._model);
};

RestberryModel.prototype.statics = function(statics) {
    this._statics = statics;
    for (var key in statics) {
        var static = statics[key];
        if (this[key]) {
            throw new Error('Can\'t override the ' + key + ' static');
        }
        this[key] = static;
    }
    return this;
};

RestberryModel.prototype.validate = function(data, next, onError) {
    var err;
    var req = this.restberry.waf && this.restberry.waf.getReq() || {};
    var editableFields = this.getFieldNamesEditable();
    var dataFields = utils.getPaths(data);
    var illegalFields = _.difference(dataFields, editableFields);
    if (illegalFields.length) {
        err = {
            modelName: this.singularName(),
            property: illegalFields[0],
        };
        this.onError(errors.BadRequestInvalidInput, err, onError);
    } else if (req.method == utils.httpMethod.PUT) {
        var missingFields = _.difference(editableFields, dataFields);
        if (missingFields.length) {
            err = {
                modelName: this.singularName(),
                property: missingFields[0],
            };
            this.onError(errors.BadRequestMissingField, err, onError);
        } else {
            next();
        }
    } else {
        next();
    }
};

module.exports = exports = RestberryModel;

var _appendQsOffsetAndLimit = function(path, offset, limit) {
    var d = {
        offset: offset,
        limit: limit,
    };
    return path + QS_START + qs.stringify(d);
};
