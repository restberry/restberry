var Route = require('restberry-router');

function RestberryModel(orm, name) {
    this.model = null;
    this.name = name;
    this.orm = orm;
    this.restberry = orm.restberry;
    this.routes = null;
    this.schema = null;

    this._setup();
};

RestberryModel.prototype._setup = function() {
    this.model = this.orm.get(this.name);
    if (this.model)  this.routes = new Route(this);
};

RestberryModel.prototype.apply = function() {
    if (this.model || !this.schema)  return;
    this.model = this.orm.set(this.name, this.schema);
    this._setup();
    return this;
};

RestberryModel.prototype.setSchema = function(schema) {
    this.schema = this.orm.schema(schema);
    return this;
};

RestberryModel.prototype.isReadAuthorized = function(m) {
    this.orm.addMethods({
        isReadAuthorized: m,
    });
    return this;
};

RestberryModel.prototype.isCreateAuthorized = function(m) {
    this.orm.addMethods({
        isCreateAuthorized: m,
    });
    return this;
};

RestberryModel.prototype.addMethods = function(methods) {
    this.orm.addMethods(this.schema, methods);
    return this;
};

RestberryModel.prototype.addStatics = function(statics) {
    this.orm.addStatics(this.schema, statics);
    return this;
};

module.exports = exports = RestberryModel;
