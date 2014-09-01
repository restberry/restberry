var RestberryModel = require('./model');
var RestberryMongoose = require('restberry-mongoose');


function RestberryORM() {
    this.restberry = null;
};

RestberryORM.prototype.model = function(name) {
    return new RestberryModel(this, name);
};

RestberryORM.prototype.use = function(orm, next) {
    // vars
    orm.restberry = this.restberry;
    // methods
    orm.model = this.model;
    // set
    this.restberry.orm = orm;
    // use
    orm.use(next);
    return this.restberry;
};

RestberryORM.prototype.useMongoose = function(next) {
    return this.use(RestberryMongoose, next);
};

module.exports = exports = new RestberryORM;
