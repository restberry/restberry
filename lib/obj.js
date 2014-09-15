var _ = require('underscore');
var errors = require('restberry-errors');
var path = require('path');
var RestberryObjs = require('./objs');
var utils = require('restberry-utils');


function RestberryObj(model, data) {
    this._id = null;
    this._isAuthorized = null;
    this._isAuthorizedToCreate = null;
    this._isAuthorizedToDelete = null;
    this._isAuthorizedToRead = null;
    this._isAuthorizedToUpdate = null;
    this._obj = (data ? new model._model(data) : null);
    this._populate = null;
    this._preRemove = null;
    this._preSave = null;

    this.model = model;
    this.restberry = model.restberry;

    this._setup();
};

RestberryObj.prototype.__isAuthorized = function(next, onError) {
    var self = this;
    var User = self.restberry.auth.getUser();
    if (User) {
        self.model.getFieldNamesOfModel(User, function(fieldNames) {
            var userIdSelf, fieldName;
            if (fieldNames.length)  fieldName = fieldNames[0];
            if (fieldName) {
                userIdSelf = utils.dotGet(self._obj, fieldName);
                if (userIdSelf)  userIdSelf = userIdSelf.toString();
            }
            var user = self.restberry.waf.getUser();
            var userId = user ? user.getId().toString() : null;
            next(!fieldName || userIdSelf === userId);
        });
    } else {
        var err = {message: 'Can\'t authorize without an enabled auth.'};
        self.onError(errors.InternalServerError, err, onError);
    }
};

RestberryObj.prototype._save = function(next) {
    this.restberry.odm.save(this._obj, next);
};

RestberryObj.prototype._setup = function() {
    for (var key in this.model._methods) {
        var method = this.model._methods[key];
        if (this[key]) {
            throw new Error('Can\'t override the ' + key + ' method');
        }
        this[key] = method;
    }
};

RestberryObj.prototype.get = function(key) {
    return this._obj ? this._obj[key] : null;
};

RestberryObj.prototype.getId = function() {
    if (this._id)  return this._id;
    if (!this._obj)  return '';
    this._id = this._obj.id || this._obj._id;
    return this.getId();
};

RestberryObj.prototype.href = function() {
    var apiPath = this.restberry.waf.apiPath;
    var pluralName = this.model.pluralName();
    return path.join(apiPath, pluralName, this._obj.id);
};

RestberryObj.prototype.isAuthorized = function(next, onError) {
    var self = this;
    var req = self.restberry.waf.getReq();
    if (self.model.isLoginRequired()) {
        var done = function(isAuthorized) {
            if (isAuthorized) {
                next(true);
                return;
            }
            self.onError(errors.Forbidden, {}, onError);
        };
        if (_isPOST(req.method) && self._isAuthorizedToCreate) {
            self._isAuthorizedToCreate(done);
        } else if (_isDELETE(req.method) && self._isAuthorizedToDelete) {
            self._isAuthorizedToDelete(done);
        } else if (_isGET(req.method) && self._isAuthorizedToRead) {
            self._isAuthorizedToRead(done);
        } else if (_isPUT(req.method) && self._isAuthorizedToUpdate) {
            self._isAuthorizedToUpdate(done);
        } else if (self._isAuthorized) {
            self._isAuthorized(done);
        } else {
            self.__isAuthorized(done);
        }
    } else {
        next();
    }
};

RestberryObj.prototype.onError = function(error, err, next) {
    err = err || {};
    this.model.onError(error, err, next);
};

RestberryObj.prototype.populate = function(fieldName, next, onError) {
    var self = this;
    var options = self.restberry.waf.getOptions();
    var _pop = function(_d) {
        self.populateModels(function(d) {
            next(_.extend(_d || {}, d));
        }, onError);
    };
    if (!fieldName)  fieldName = self.model.singularName();
    fieldName = fieldName.split('.').pop();
    if (_.contains(options.expand, fieldName)) {
        // self.restberry.waf.delExpand(fieldName);
        if (self._populate) {
            self._populate(_pop);
        } else {
            _pop();
        }
    } else {
        next();
    }
};

RestberryObj.prototype.populateModels = function(next, onError) {
    var self = this;
    var d = {};
    self.model.getFieldsOfModels(function(fields) {
        utils.forEachAndDone(fields, function(field, iter) {
            var fieldName = field.fieldName;
            var populate = function(json) {
                d[fieldName] = json;
                iter();
            };
            var model = field.model;
            if (!model) {
                var err = {message: 'Model of related fields can\'t be null'};
                self.onError(errors.InternalServerError, err, onError);
                return;
            }
            var objId = utils.dotGet(self._obj, fieldName);
            if (!objId || objId === self._obj.id) {
                iter();
                return;
            }
            if (_.isArray(objId)) {
                var objIds = objId;
                var query = self.restberry.odm.getQueryIdInList(objIds);
                model.find(query, function(objs) {
                    objs.toJSON(function(json) {
                        populate(json[model.pluralName()]);
                    }, fieldName);
                });
            } else {
                model.findById(objId, function(obj) {
                    obj.toJSON(populate, false, fieldName);
                });
            }
        }, function() {
            next(d);
        });
    });
};

RestberryObj.prototype.remove = function(next, onError) {
    var self = this;
    var _remove = function() {
        self.restberry.odm.remove(self._obj, function(err) {
            if (err) {
                self.onError(errors.BadRequest, err, onError);
            } else {
                next();
            }
        });
    };
    self.isAuthorized(function() {
        if (self._preRemove) {
            self._preRemove(function(err) {
                if (err) {
                    self.onError(errors.BadRequest, err, onError);
                } else {
                    _remove();
                }
            });
        } else {
            _remove();
        }
    });
};

RestberryObj.prototype.save = function(next, onError) {
    var self = this;
    var _save = function() {
        self._save(function(err) {
            if (err) {
                // TODO(materik)
                // * this is a mongoose specific error, need to find something
                //   general
                if (err.message && err.message.indexOf('E11000') > -1) {
                    err.prototype = self.model.singularName();
                    self.onError(errors.Conflict, err, onError);
                } else {
                    self.onError(errors.BadRequest, err, onError);
                }
            } else {
                next(self);
            }
        });
    };
    self.isAuthorized(function() {
        if (self._preSave) {
            self._preSave(function(err) {
                if (err) {
                    self.onError(errors.BadRequest, err, onError);
                } else {
                    _save();
                }
            });
        } else {
            _save();
        }
    });
};

RestberryObj.prototype.set = function(key, val) {
    this._obj[key] = val;
};

// TODO(materik): make this look nicer
RestberryObj.prototype.toJSON = function(next, nested, fieldName, onError) {
    var self = this;
    if (!next) {
        throw new Error('Need to provide a callback.');
    }
    nested = (nested === undefined ? true : nested);
    fieldName = fieldName || this.model.singularName();
    self.isAuthorized(function() {
        self.populate(fieldName, function(populatedObj) {
            var ret = self._obj.toObject({hide: '__v'});
            var d = {
                href: self.href(),
                id: ret._id,
            };
            if (populatedObj) {
                var hfn = self.model.getFieldNamesHidden();
                _.each(hfn, function(fieldName) {
                    delete ret[fieldName];
                });
                var options = self.restberry.waf.getOptions();
                d = _applyFields(d, ret, options.fields, populatedObj);
            }
            if (nested) {
                var _d = {};
                _d[self.model.singularName()] = d;
                next(_d);
            } else {
                next(d);
            }
        }, onError);
    }, onError);
};

RestberryObj.prototype.update = function(data, next) {
    var self = this;
    self.model.validate(data, function() {
        self._obj = _.extend(self._obj, data);
        self._obj.timestampUpdated = new Date();
        self.save(next);
    });
};

RestberryObj.obj = function(model, _obj) {
    var obj = new RestberryObj(model);
    obj._obj = _obj;
    return obj;
};

RestberryObj.objs = function(model, _objs) {
    var objs = new RestberryObjs(model);
    _.each(_objs, function(_obj) {
        objs.push(RestberryObj.obj(model, _obj));
    });
    return objs;
};

module.exports = exports = RestberryObj;

// TODO(materik):
// * make this look nicer
var _applyFields = function(d, ret, fields, populatedObj) {
    var origFields = fields;
    if (!fields || fields.length == 0) {
        fields = _.without(Object.keys(ret), '_id');
        fields = fields.concat(Object.keys(d));
    } else {
        fields = fields.concat(['id', 'href']);
    }
    for (var i in fields) {
        var field = fields[i];
        if (ret[field])  d[field] = ret[field];
    }
    for (var key in populatedObj) {
        utils.dotSet(d, key, populatedObj[key]);
    }
    if (origFields.length) {
        for (var key in d) {
            if (fields.indexOf(key) < 0)  delete d[key];
        }
    }
    return d;
};

var _isDELETE = function(method) {
    return method === utils.httpMethod.DELETE;
};

var _isGET = function(method) {
    return method === utils.httpMethod.GET;
};

var _isPOST = function(method) {
    return method === utils.httpMethod.POST;
};

var _isPUT = function(method) {
    return method === utils.httpMethod.PUT;
};
