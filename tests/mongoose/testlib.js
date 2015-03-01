var restberry = require('./app');
var testlib = require(process.env.NODE_PATH + '/testlib');

exports.setupTeardown = function(next) {
    testlib.clearData(restberry, next);
};
