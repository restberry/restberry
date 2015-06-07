var _ = require('underscore');

function RestberryAuth(module) {
    _.extend(this, module);
};

RestberryAuth.prototype.setRestberry = function(restberry) {
    this.restberry = restberry;
    if (this.auths) {
        _.each(this.auths, function(auth) {
            auth.restberry = restberry;
        });
    }
};

RestberryAuth.canApply = function(auth) {
    return _.isFunction(auth.enable) &&
           _.isFunction(auth.getUser) &&
           _.isFunction(auth.isUserModel) &&
           _.isFunction(auth.use);
};

module.exports = exports = RestberryAuth;
