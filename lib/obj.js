var _ = require('underscore');
var errors = require('restberry-errors');
var path = require('path').posix;
var utils = require('restberry-utils');

function RestberryObj(model, data, fieldName) {
    this._isAuthorized = null;
    this._isAuthorizedToCreate = null;
    this._isAuthorizedToDelete = null;
    this._isAuthorizedToRead = null;
    this._isAuthorizedToUpdate = null;
    this._obj = (data ? new model._model(data) : null);
    this._populate = null;
    this._preRemove = undefined;
    this._preSave = undefined;

    this.fieldName = fieldName;
    this.model = model.copy();
    this.restberry = model.restberry;

    this._applyMethods();
    this._setup();
}

RestberryObj.prototype.__isAuthorized = function(next, onError) {
    var self = this;
    var User = self.restberry.auth.getUser();
    if (User) {
        self.model.getFieldNamesOfModel(User, function(fieldNames) {
            var userIdSelf;
            var fieldName;
            if (fieldNames.length) {
                fieldName = fieldNames[0];
            }
            if (fieldName) {
                userIdSelf = utils.dotGet(self, fieldName);
                userIdSelf = userIdSelf && userIdSelf.toString();
            }
            var user = null;
            if (self.restberry.waf) {
                user = self.restberry.waf.getUser();
            }
            var userId = user && user.id && user.id.toString();
            next(!fieldName || userIdSelf === userId);
        });
    } else {
        var err = {message: 'Can\'t authorize without an enabled auth.'};
        self.onError(errors.InternalServerError, err, onError);
    }
};

RestberryObj.prototype._applyMethods = function() {
    for (var key in this.model._methods) {
        if (this[key]) {
            throw new Error('Can\'t override the ' + key + ' method');
        }
        var method = this.model._methods[key];
        this[key] = method;
    }
};

RestberryObj.prototype._key = function(splitName) {
    if (splitName && this.fieldName) {
        return this.fieldName.split('.').pop();
    }
    return this.fieldName || this.model.singularName();
};

RestberryObj.prototype._save = function(next) {
    var _lockedFields = this._lockedFields;
    var obj = _.pick(this, function(val, key) {
        return !_.contains(_lockedFields, key);
    });
    for (var key in obj) {
        this._obj[key] = obj[key];
    }
    this.restberry.odm.save(this._obj, next);
};

RestberryObj.prototype._set = function(key, val) {
    var self = this;
    if (_.isString(key)) {
        if (_.isObject(val)) {
            _.each(val, function(val, _key) {
                self._set(key + '.' + _key, val);
            });
        } else {
            utils.dotSet(self, key, val);
        }
    } else if (_.isObject(key)) {
        _.each(key, function(val, key) {
            self._set(key, val);
        });
    }
};

RestberryObj.prototype._setup = function() {
    this.id = this._obj && this._obj.id;
    this._lockedFields = _.allKeys(this);
    this._lockedFields.push('_lockedFields');
    for (var key in this._toObject()) {
        if (this[key]) {
            throw new Error('Can\'t override the ' + key + ' field');
        }
        var field = this._obj[key];
        this[key] = field;
    }
};

RestberryObj.prototype._toObject = function() {
    return this._obj && this.restberry.odm.toObject(this._obj) || {};
};

RestberryObj.prototype.copy = function(fieldName) {
    var model = this.model.copy();
    return RestberryObj.obj(model, this._obj, fieldName);
};

RestberryObj.prototype.expandJSON = function() {
    return this.model.expandJSON();
};

RestberryObj.prototype.href = function() {
    if (!this.restberry.waf) {
        return '';
    }
    var apiPath = this.restberry.waf.apiPath;
    var pluralName = this.model.pluralName();
    return path.join(apiPath, pluralName, this.id);
};

RestberryObj.prototype.isAuthorized = function(next, onError) {
    var self = this;
    var req = self.restberry.waf && self.restberry.waf.getReq() || {};
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

RestberryObj.prototype.options = function() {
    return this.model.options();
};

RestberryObj.prototype.populate = function(next, onError) {
    var self = this;
    var d = {};
    self.model.getFieldsOfModels(function(fields) {
        var visibleFields = self.model.getFieldNamesVisible(self._key(true));
        utils.forEachAndDone(fields, function(field, iter) {
            var fieldName = field.fieldName;
            var fieldNameNorm = _.first(fieldName.split('.'));
            if (!_.contains(visibleFields, fieldNameNorm)) {
                iter();
                return;
            }
            var model = field.model;
            var isArray = field.isArray;
            var populate = function(obj) {
                obj = obj.copy(fieldName);
                obj.options().popExpand(self._key(true));
                obj.toJSON(function(json) {
                    d = _.extend(d, json);
                    iter();
                }, onError);
            };
            if (model) {
                model = model.setOptions(self.options());
                var objId = utils.dotGet(self, fieldName);
                if (!objId) {
                    iter();
                    return;
                }
                if (isArray) {
                    var query = self.restberry.odm.getQueryIdInList(objId);
                    model.find(query, populate);
                } else {
                    model.findById(objId, populate);
                }
            } else {
                var err = {message: 'Model of related fields can\'t be null'};
                self.onError(errors.InternalServerError, err, onError);
                return;
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
            var list = _.clone(self._preRemove);
            utils.forEachAndDone(list, function(preRemove, iter) {
                self.__preRemove = preRemove;
                self.__preRemove(function(err) {
                    if (err) {
                        return self.onError(errors.BadRequest, err, onError);
                    }
                    iter();
                });
            }, function() {
                _remove();
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
                if (self.restberry.odm.isConflictError(err)) {
                    err.prototype = self.model.singularName();
                    self.onError(errors.Conflict, err, onError);
                } else {
                    self.onError(errors.BadRequest, err, onError);
                }
            } else if (next) {
                next(self);
            }
        });
    };
    self.isAuthorized(function() {
        if (self._preSave) {
            var list = _.clone(self._preSave);
            utils.forEachAndDone(list, function(preSave, iter) {
                self.__preSave = preSave;
                self.__preSave(function(err) {
                    if (err) {
                        return self.onError(errors.BadRequest, err, onError);
                    }
                    iter();
                });
            }, function() {
                _save();
            });
        } else {
            _save();
        }
    });
};

RestberryObj.prototype.toJSON = function(next, onError) {
    if (!_.isFunction(next)) {
        throw Error('next is not defined.');
    }
    var self = this;
    self.isAuthorized(function() {
        self.toObject(function(d) {
            var json = {};
            var dd = {
                href: self.href(),
                id: self.id && self.id.toString(),
            };
            if (!self.href || self.restberry.disableHref) {
                delete dd.href;
            }
            json[self._key()] = _.extend(dd, d);
            next(json);
        }, onError);
    }, onError);
};

RestberryObj.prototype.toObject = function(next) {
    if (!_.isFunction(next)) {
        throw Error('next is not defined.');
    }
    var self = this;
    var obj = self._toObject();
    var fields = self.model.getFieldNamesVisible(self._key(true));
    _.each(_.keys(obj), function(key) {
        if (!_.contains(fields, key)) {
            delete obj[key];
        }
    });
    var populate = function(_d) {
        obj = _.extend(obj, _d || {});
        self.populate(function(d) {
            _.each(_.keys(d), function(key) {
                utils.dotSet(obj, key, d[key]);
            });
            next(obj);
        });
    };
    if (self._populate) {
        self._populate(populate);
    } else {
        populate();
    }
};

RestberryObj.prototype.update = function(data, next, onError) {
    var self = this;
    self.model.validate(data, function() {
        self._set(data);
        self.timestampUpdated = new Date();
        self.save(next, onError);
    }, onError);
};

RestberryObj.obj = function(model, _obj, fieldName) {
    var obj = new RestberryObj(model, null, fieldName);
    obj._obj = _obj;
    obj._setup();
    return obj;
};

module.exports = exports = RestberryObj;

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
