var _ = require('underscore');
var config = require('./config');
var utils = require('restberry-utils');


module.exports = function(restberry) {
    if (config.isDev) {
        restberry.routes
            .addCustomRoute({
                action: function(req, res, next) {
                    var models = restberry.odm.mongoose.models;
                    var keys = _.keys(models);
                    utils.forEachAndDone(keys, function(key, iter) {
                        var model = models[key];
                        model.remove(iter);
                    }, function() {
                        restberry.waf.handleRes({}, req, res, next);
                    });
                },
                path: '/dev/clearData',
            });
    }
};
