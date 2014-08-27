var Router = require('./router.js');

function RestberryModel(name, connections) {
    this.connections = connections;
    this.model = null;
    this.name = name;
    this.route = null;
    this.schema = null;

    this._setup();
};

RestberryModel.prototype._setup = function() {
    this.model = this.connections.db.get(this.name);
    if (this.model) {
        this.route = new Router(this.connections.web, this.model);
    }
};

RestberryModel.prototype.apply = function() {
    if (this.model || !this.schema)  return;
    this.model = this.connections.db.apply(this.name, this.schema);
    this.route = new Router(this.connections.web, this.model);
    return this;
};

RestberryModel.prototype.setSchema = function(schema) {
    this.schema = this.connections.db.schema(schema);
    return this;
};

RestberryModel.prototype.isReadAuthorized = function(m) {
    this.connections.db.addMethods({
        isReadAuthorized: m,
    });
    return this;
};

RestberryModel.prototype.isCreateAuthorized = function(m) {
    this.connections.db.addMethods({
        isCreateAuthorized: m,
    });
    return this;
};

RestberryModel.prototype.addMethods = function(methods) {
    this.connections.db.addMethods(this.schema, methods);
    return this;
};

RestberryModel.prototype.addStatics = function(statics) {
    this.connections.db.addStatics(this.schema, statics);
    return this;
};

module.exports = exports = RestberryModel;
