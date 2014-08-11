var _ = require('underscore');
var _s = require('underscore.string');
var crypto = require('crypto');


var EMAIL_REGEX = /[\w\d_]+@\w+\.\w+[\w\.]*/;
var MONTH_REGEX = /20\d{2}\-(0(?=[1-9])|1(?=[0-2]{1}))\d{1}/;
var URL_REGEX = /http[s]{0,1}:\/\/(www\.){0,1}\w+\.{1}\w+[\w\/#\?&]*/;

var prependZeros = function(str, length) {
    str = str.toString();
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
};

var base64encode = function(str) {
    return new Buffer(str).toString('base64');
};

var camelCaseStr = function(str) {
    str = str.toLowerCase();
    return _s.camelize(str);
};

var dotGet = function(obj, key) {
    var ret = obj;
    var keySplit = key.split('.');
    for (var i in keySplit) {
        var k = keySplit[i];
        if (ret)  ret = ret[k];
    }
    return ret;
};

var dotSet = function(obj, key, val) {
    var ret = obj;
    var keySplit = key.split('.');
    var lastKey = keySplit.pop();
    for (var i in keySplit) {
        var k = keySplit[i];
        ret = ret[k];
    }
    if (ret)  ret[lastKey] = val;
};

var forEachAndDone = function(objs, iter, done, i) {
    if (!i)  i = 0;
    if (i >= objs.length) {
        done();
    } else {
        obj = objs[i];
        iter(obj, function() {
            forEachAndDone(objs, iter, done, i+1);
        });
    }
};

var getDate = function() {
    var date = new Date();
    var y = date.getFullYear();
    var m = prependZeros(date.getMonth() + 1, 2);
    var d = prependZeros(date.getDate(), 2);
    return y + '-' + m + '-' + d;
};

var getPaths = function(dict) {
    var paths = [];
    for (key in dict) {
        var key = key;
        var val = dict[key];
        if (_.isObject(val)) {
            var nestedPaths = getPaths(val);
            if (nestedPaths.length) {
                for (i in nestedPaths) {
                    var np = null;
                    if (nestedPaths[i].match(/^\d+$/)) {
                        np = 0;
                    } else {
                        np = nestedPaths[i].replace(/\d+\./, '0.');
                    };
                    paths.push(key + '.' + np);
                };
            } else if (_.isArray(val)) {
                paths.push(key + '.0');
            };
        } else {
            paths.push(key);
        };
    };
    return _.uniq(paths);
};

var handleError = function(err, done, next, returnObject) {
    if (err) {
        done(returnObject ? new Error(err) : err);
    } else {
        next();
    };
};

var isDict = function(dict) {
    return Object.prototype.toString.call(dict) == '[object Object]';
};

var isJSONParseable = function(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    };
    return true;
};

var isValidEmail = function(email) {
    if (!email)  return false;
    return email.match(EMAIL_REGEX) != null;
};

var isValidMonth = function(month) {
    if (!month)  return false;
    return month.match(MONTH_REGEX) != null;
};

var isValidURL = function(url) {
    if (!url)  return false;
    return url.match(URL_REGEX) != null;
};

var lower = function(str) {
    return str.toLowerCase();
};

var makeSalt = function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
};

var mergeDicts = function(d1, d2) {
    var d = {};
    for (var key in d1)  d[key] = d1[key];
    for (var key in d2)  d[key] = d2[key];
    return d;
};

var sha1encrypt = function(salt, string) {
    return crypto.createHmac('sha1', salt).update(string).digest('hex');
};

exports.prependZeros = prependZeros;
exports.base64encode = base64encode;
exports.camelCaseStr = camelCaseStr;
exports.dotGet = dotGet;
exports.dotSet = dotSet;
exports.forEachAndDone = forEachAndDone;
exports.getDate = getDate;
exports.getPaths = getPaths;
exports.handleError = handleError;
exports.isDict = isDict;
exports.isJSONParseable = isJSONParseable;
exports.isValidEmail = isValidEmail;
exports.isValidMonth = isValidMonth;
exports.isValidURL = isValidURL;
exports.lower = lower;
exports.makeSalt = makeSalt;
exports.mergeDicts = mergeDicts;
exports.sha1encrypt = sha1encrypt;
