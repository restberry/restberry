var controller = require('./controller');
var httpMethod = require('./http-method');
var Route = require('./route');


function Router(web, model) {
    this.web = web;
    this.model = model;
    this.apiPath = null;
};

Router.prototype.addCreate = function(config) {
    if (!config)  config = {};
    config.controller = controller.create;
    config.method = httpMethod.POST;
    return this.addCustom(config);
};

Router.prototype.addCustom = function(config) {
    if (!config)  config = {};
    config.apiPath = this.apiPath;
    return new Route(this, this.model)
        .config(config)
        .apply(this.web);
};

Router.prototype.addReadMany = function(config) {
    if (!config)  config = {};
    config.controller = controller.readMany;
    config.method = httpMethod.GET;
    return this.addCustom(config);
};

module.exports = exports = Router;
