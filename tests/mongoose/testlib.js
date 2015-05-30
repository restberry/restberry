var restberry = require('./app');
var testlib = require('../testlib');

exports.setupTeardown = function(next) {
    testlib.clearData(restberry, next);
};
