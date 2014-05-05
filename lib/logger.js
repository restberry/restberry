var _ = require('underscore');
var crypto = require('crypto');
var ns = require('./node_shortcuts.js');
var utils = require('./utils.js');


var RED = '\033[31m';
var GREEN = '\033[32m';
var YELLOW = '\033[33m';
var BLUE = '\033[34m';
var PURPLE = '\033[35m';
var TURQUISE = '\033[36m';
var GREY = '\033[1;37m';
var RESET = '\033[0m';


exports.request = function(req) {
    var remoteAddress = req.connection.remoteAddress;
    var url = ns.getReqPath(req, true);
    var method = req.method;
    var data = _.clone(req.body);
    data = (data ? data : {});
    data = _replacePasswords(data);
    data = JSON.stringify(data, null, 2);
    var msg = '<' + url + '> <' + data + '>';
    _logMethod(remoteAddress, method, msg);
};

exports.response = function(res, json) {
    var remoteAddress = res.req.connection.remoteAddress;
    var msg = (json ? '<' + JSON.stringify(json, null, 2) + '>' : null);
    var code = res.statusCode;
    if (code >= 200 && code < 300) {
        success(remoteAddress, code, msg);
    } else {
        error(remoteAddress, code, msg);
    };
};

exports.log = function(part1, part2, msg) {
    _log(GREY, part1, part2, msg);
};

// ----- OTHER -----;

var error = function(remoteAddress, code, msg) {
    _log(RED, remoteAddress, code, msg);
};

var success = function(remoteAddress, code, msg) {
    _log(GREEN, remoteAddress, code, msg);
};

var _log = function(color, part1, part2, msg) {
    var sep = '|';
    var log = RESET + new Date().toISOString() + sep;
    if (part1)  log = log + color + part1 + RESET + sep;
    if (part2)  log = log + color + part2 + RESET + sep;
    log = log + (msg ? msg : '');
    console.log(log);
};

// ----- Exports -----;

exports.error = error;
exports.success = success;

var _replacePasswords = function(data) {
    for (key in data) {
        if (key === 'password') {
            data[key] = '**********';
        } else {
            var val = data[key];
            if (_.isObject(val)) {
                data[key] = _replacePasswords(val);
            };
        };
    };
    return data;
};

var _logMethod = function(remoteAddress, method, msg) {
    if (method == 'GET') {
        color = BLUE;
    } else if (method == 'POST') {
        color = PURPLE;
    } else if (method == 'PUT') {
        color = YELLOW;
    } else if (method == 'DELETE') {
        color = TURQUISE;
    };
    _log(color, remoteAddress, method, msg);
};
