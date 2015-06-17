var _ = require('underscore');
var RestberryObj = require('./obj');
var util = require('util');
var utils = require('restberry-utils');

function RestberryObjs(model, fieldName) {
    this.fieldName = fieldName;
    this.model = model;
    this.restberry = model.restberry;
}

util.inherits(RestberryObjs, Array);

RestberryObjs.prototype._key = function(splitName) {
    if (splitName && this.fieldName) {
        return this.fieldName.split('.').pop();
    }
    return this.fieldName || this.model.pluralName();
};

RestberryObjs.prototype.copy = function(fieldName) {
    var model = this.model.copy();
    return RestberryObjs._objs(model, this, fieldName);
};

RestberryObjs.prototype.options = function() {
    return this.model.options();
};

RestberryObjs.prototype.toJSON = function(next, onError, expand) {
    var self = this;
    var d = [];
    utils.forEachAndDone(this, function(obj, iter) {
        obj.toJSON(function(json) {
            d.unshift(json[obj._key()]);
            iter();
        }, onError, expand);
    }, function() {
        var json = {};
        json[self._key()] = d;
        next(json);
    });
};

RestberryObjs._objs = function(model, objs, fieldName) {
    var newObjs = new RestberryObjs(model, fieldName);
    _.each(objs, function(obj) {
        newObjs.push(RestberryObj.obj(model, obj._obj, fieldName));
    });
    return newObjs;
};

RestberryObjs.objs = function(model, _objs, fieldName) {
    var objs = new RestberryObjs(model, fieldName);
    _.each(_objs, function(_obj) {
        objs.push(RestberryObj.obj(model, _obj, fieldName));
    });
    return objs;
};

module.exports = exports = RestberryObjs;
