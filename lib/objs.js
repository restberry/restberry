var _ = require('underscore');
var RestberryObj = require('./obj');
var utils = require('restberry-utils');


function RestberryObjs(model, fieldName) {
    this.fieldName = fieldName;
    this.model = model;
    this.restberry = model.restberry;
};

RestberryObjs.prototype.__proto__ = Array.prototype;

RestberryObjs.prototype.copy = function(fieldName) {
    var model = this.model.copy();
    return RestberryObjs._objs(model, this, fieldName);
};

RestberryObjs.prototype.key = function(splitName) {
    if (splitName && this.fieldName) {
        return this.fieldName.split('.').pop();
    }
    return this.fieldName || this.model.pluralName();
};

RestberryObjs.prototype.options = function() {
    return this.model.options();
};

RestberryObjs.prototype.toJSON = function(next, onError, expand) {
    var self = this;
    var d = [];
    utils.forEachAndDone(this, function(obj, iter) {
        obj.toJSON(function(json) {
            d.push(json[obj.key()]);
            iter();
        }, onError, expand);
    }, function() {
        var json = {};
        json[self.key()] = d;
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
