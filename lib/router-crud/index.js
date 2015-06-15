var controller = require('./controller');
var utils = require('restberry-utils');

module.exports = {

    Create: {
        method: function(config) {
            if (!config)  config = {};
            config._controller = controller.create;
            config.method = utils.httpMethod.POST;
            config._single = false;
            return this.addCustomRoute(config);
        },
    },

    CRUD: {
        isPlural: true,
        method: function(config) {
            if (!config)  config = {};
            return this.addDeleteRoute(config)
                       .addCreateRoute(config)
                       .addPartialUpdateRoute(config)
                       .addReadRoute(config)
                       .addReadManyRoute(config)
                       .addUpdateRoute(config)
        },
    },

    Delete: {
        method: function(config) {
            if (!config)  config = {};
            config._controller = controller.del;
            config.method = utils.httpMethod.DELETE;
            config._single = true;
            return this.addCustomRoute(config);
        },
    },

    PartialUpdate: {
        method: function(config) {
            if (!config)  config = {};
            config._controller = controller.update;
            config.method = utils.httpMethod.POST;
            config._single = true;
            return this.addCustomRoute(config);
        },
    },

    Read: {
        method: function(config) {
            if (!config)  config = {};
            config._controller = controller.read;
            config.method = utils.httpMethod.GET;
            config._single = true;
            return this.addCustomRoute(config);
        },
    },

    ReadMany: {
        method: function(config) {
            if (!config)  config = {};
            config._controller = controller.readMany;
            config.method = utils.httpMethod.GET;
            config._single = false;
            return this.addCustomRoute(config);
        },
    },

    Update: {
        method: function(config) {
            if (!config)  config = {};
            config._controller = controller.update;
            config.method = utils.httpMethod.PUT;
            config._single = true;
            return this.addCustomRoute(config);
        },
    },

};
