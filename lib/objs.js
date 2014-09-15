var _ = require('underscore');
var utils = require('restberry-utils');


function RestberryObjs(model) {
    this.model = model;
    this.restberry = model.restberry;
};

RestberryObjs.prototype.__proto__ = Array.prototype;

RestberryObjs.prototype.toJSON = function(next, fieldName) {
    var self = this;
    var options = self.restberry.waf.getOptions();
    var key = self.model.pluralName();
    var json = {};
    var d = [];
    fieldName = fieldName || self.model.singularName();
    fieldName = fieldName.split('.').pop();
    var expand = _.contains(options.expand, fieldName);
    utils.forEachAndDone(this, function(obj, iter) {
        if (expand)  options.expand.push(fieldName);
        obj.toJSON(function(json) {
            d.push(json);
            iter();
        }, false, fieldName);
    }, function() {
        json[key] = d;
        next(json);
    });
};

module.exports = exports = RestberryObjs;
