var config = require('../config/config.js');
var http = require('./http.js');
var logger = require('./logger.js');
var ns = require('./node_shortcuts.js');
var utils = require('./utils.js');


var AUTHENTICATION_ERROR = 'AuthenticationError';
var INVALID_INPUT_ERROR = 'InvalidInputError';
var MISSING_FIELD_ERROR = 'MissingFieldError';
var PAYMENT_LEVEL_ERROR = 'PaymentLevelError';
var VALIDATION_ERROR = 'ValidationError';
var BAD_REQUESTS = [;
    AUTHENTICATION_ERROR,
    INVALID_INPUT_ERROR,
    MISSING_FIELD_ERROR,
    VALIDATION_ERROR,
];

var throwBadRequest = function(req, res, err) {
    var err = _badRequest(req, err);
    _throw(req, res, err);
};

var throwConflict = function(req, res, err) {
    var err = _conflict(req, err);
    _throw(req, res, err);
};

var throwServerIssue = function(req, res, err) {
    var err = _serverIssue(req, err);
    _throw(req, res, err);
};

var throwNotFound = function(req, res, err) {
    var err = _notFound(req, err);
    _throw(req, res, err);
};

var throwUnauthenticated = function(req, res, err) {
    var err = _unauthenticated(req, err);
    _throw(req, res, err);
};

var throwUnauthorized = function(req, res, err) {
    var err = _unauthorized(req, err);
    _throw(req, res, err);
};

var _throw = function(req, res, err) {
    res.status(err.error.statusCode);
    ns.res(err, req, res);
};

// ----- Exports -----;

exports.AUTHENTICATION_ERROR = AUTHENTICATION_ERROR;
exports.INVALID_INPUT_ERROR = INVALID_INPUT_ERROR;
exports.MISSING_FIELD_ERROR = MISSING_FIELD_ERROR;
exports.PAYMENT_LEVEL_ERROR = PAYMENT_LEVEL_ERROR;
exports.VALIDATION_ERROR = VALIDATION_ERROR;

exports.throwBadRequest = throwBadRequest;
exports.throwConflict = throwConflict;
exports.throwNotFound = throwNotFound;
exports.throwServerIssue = throwServerIssue;
exports.throwUnauthenticated = throwUnauthenticated;
exports.throwUnauthorized = throwUnauthorized;

// ----- Helper -----;

var _devMessage = function(req, err, msg) {
    var method = req.method;
    var path = ns.getReqPath(req);
    var data = req.body;
    if (data.password) {
        data.password = '**********';
    }
    data = JSON.stringify(data);
    return 'Requested <' + method + '> <' + path + '> with data ' +;
           '<' + data + '>. ' + (msg ? msg + ' ' : '') + JSON.stringify(err);
};

var _error = function(req, err, statusCode, title, message, devMessage) {
    var property = (err.property ? err.property : '');
    return {
        error: {
            statusCode: statusCode,
            property: property,
            title: title,
            message: message,
            devMessage: _devMessage(req, err, devMessage),
        }
    }
};

var _getMessageProperty = function(err) {
    return err.property.replace(/\..*/, '');
};

var _getProperty = function(err) {
    var property = '';
    if (err.property) {
        property = err.property;
    } else if (err.errors) {
        if (err.errors.type && err.errors.type.path) {
            property = err.errors.type.path;
        } else {
            property = Object.keys(err.errors)[0];
        }
    }
    property = property.replace(/\.\d+\./, '.');
    return property;
};

// ----- Errors -----;

var _badRequest = function(req, err) {
    errName = err.name;
    if (errName == AUTHENTICATION_ERROR) {
        return _authenticationError(req, err);
    } else if (errName == INVALID_INPUT_ERROR) {
        return _invalidInputError(req, err);
    } else if (errName == MISSING_FIELD_ERROR) {
        return _missingFieldError(req, err);
    } else if (errName == PAYMENT_LEVEL_ERROR) {
        return _paymentLevelError(req, err);
    } else if (errName == VALIDATION_ERROR) {
        return _validationError(req, err);
    }
    var title = (err.title ? err.title : 'Bad Request');
    return _error(req, err, http.BAD_REQUEST, title, err.message, '');
};

var _conflict = function(req, err) {
    var statusCode = http.CONFLICT;
    var title = 'Conflict';
    var message = 'There already exists a \'' + _getMessageProperty(err) + '\'.';
    var devMessage = 'This is the conflicted object: <' + err.obj + '>.';
    return _error(req, err, statusCode, title, message, devMessage);
};

var _notFound = function(req, err) {
    var statusCode = http.NOT_FOUND;
    var title = 'Not Found';
    var message = 'Couldn\'t find \'' + _getMessageProperty(err) + '\'.';
    var devMessage = 'Make sure you have the right id: <' + req.params.id + '>.';
    return _error(req, err, statusCode, title, message, devMessage);
};

var _serverIssue = function(req, err) {
    var statusCode = http.SERVER_ISSUE;
    var title = 'Server Issue';
    var message = 'We\'re on it!';
    var devMessage = err.name;
    return _error(req, err, statusCode, title, message, devMessage);
};

var _unauthenticated = function(req, err) {
    var statusCode = http.UNAUTHENTICATED;
    var title = 'Unauthenticated';
    var message = 'Need to be logged in to perform this action.';
    var devMessage = 'Make sure you are logged in and authenticated.';
    return _error(req, err, statusCode, title, message, devMessage);
};

var _unauthorized = function(req, err) {
    var statusCode = http.UNAUTHORIZED;
    var title = 'Unauthorized';
    var message = 'You are not authorized!';
    var devMessage = 'Make sure you\'re logged in with the correct credentials.';
    return _error(req, err, statusCode, title, message, devMessage);
};

// ----- Bad Request Suberrors -----;

var _authenticationError = function(req, err) {
    var statusCode = http.BAD_REQUEST;
    var title = 'Authentication Error';
    var message = err.message;
    var devMessage = 'Make sure you have the correct credentials.';
    return _error(req, err, statusCode, title, message, devMessage);
};

var _invalidInputError = function(req, err) {
    err.property = _getProperty(err);
    var statusCode = http.BAD_REQUEST;
    var title = 'Invalid Input';
    var message = 'Recieved an invalid field \'' + _getMessageProperty(err) +;
                  '\' for \'' + err.modelName + '\'';
    var devMessage = '';
    return _error(req, err, statusCode, title, message, devMessage);
};

var _missingFieldError = function(req, err) {
    var statusCode = http.BAD_REQUEST;
    var title = 'Missing Field';
    var message = 'Missing required field \'' + _getMessageProperty(err) + ;
                  '\' of \'' + err.objName + '\'';
    var devMessage = '';
    return _error(req, err, statusCode, title, message, devMessage);
};

var _paymentLevelError = function(req, err) {
    var statusCode = http.BAD_REQUEST;
    var title = 'Upgrade Required';
    var message = 'This project\'s payment level doesn\'t allow this action.';
    var devMessage = 'Look into the project\'s paymentLevel';
    return _error(req, err, statusCode, title, message, devMessage);
};

var _validationError = function(req, err) {
    err.property = _getProperty(err);
    var statusCode = http.BAD_REQUEST;
    var title = 'Validation Error';
    if (err.errors) {
        var property = Object.keys(err.errors)[0];
        var type = err.errors[property].type;
        if (type == 'required') {
            return _missingFieldError(req, err);
        }
    }
    var message = 'Wasn\'t able to validate \'' + _getMessageProperty(err) +;
                  '\' for \'' + err.objName + '\'.';
    var devMessage = '';
    return _error(req, err, statusCode, title, message, devMessage);
};
