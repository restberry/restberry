var httpStatus = require('http-status');
var mongoose = require('mongoose');
var requests = require('http-requests');


var EMAIL = 'test@restberry.com';
var PASSWORD = 'asdfasdf';
var DB = 'mongodb://localhost/npm-restberry-test';
requests.config({
    apiPath: '/api/v1',
    host: 'dev1',
    port: 5000,
    ssl: false,
});

var setupTeardown = function(next) {
    mongoose.connect(DB);
    var conn = mongoose.createConnection(DB, function(err) {
        if (err)  console.log(err);
        conn.db.dropDatabase(function(err) {
            if (err)  console.log(err);
            mongoose.disconnect(next);
        });
    });
};
exports.setUp = setupTeardown;
exports.tearDown = setupTeardown;

exports.testCreate = function(test) {
    var d = {name: 'test'};
    requests.post('/parents', d, function(code) {
        test.equal(code, httpStatus.CREATED);
        test.done();
    });
};

//  exports.testCreateConflict = function(test) {
//      var d = {name: 'test'};
//      requests.post('/parents', d, function(code) {
//          test.equal(code, httpStatus.CREATED);
//          requests.post('/parents', d, function(code) {
//              test.equal(code, httpStatus.CONFLICT);
//              test.done();
//          });
//      });
//  };

exports.testReadMany = function(test) {
    requests.get('/parents', function(code, json) {
        test.equal(code, httpStatus.OK);
        test.equal(json.parents.length, 0);
        var d = {name: 'test'};
        requests.post('/parents', d, function(code) {
            test.equal(code, httpStatus.CREATED);
            requests.get('/parents', function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.parents.length, 1);
                test.done();
            });
        });
    });
};

exports.testDelete = function(test) {
    var d = {name: 'test'};
    requests.post('/parents', d, function(code, json) {
        test.equal(code, httpStatus.CREATED);
        var id = json.parent.id;
        requests.del('/parents/' + id, function(code) {
            test.equal(code, httpStatus.NO_CONTENT);
            requests.get('/parents', function(code, json) {
                test.equal(code, httpStatus.OK);
                test.equal(json.parents.length, 0);
                test.done();
            });
        });
    });
};

exports.testUnauthCreate = function(test) {
    _createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        var path = '/users/' + userId + '/auths';
        requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.UNAUTHORIZED);
            test.done();
        });
    });
};

exports.testAuthCreate = function(test) {
    _createUser(EMAIL, PASSWORD, function(userId) {
        _loginUser(EMAIL, PASSWORD, function(userId) {
            var d = {name: 'test'};
            var path = '/users/' + userId + '/auths';
            requests.post(path, d, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                test.done();
            });
        });
    });
};

exports.testUnauthRead = function(test) {
    _createUser(EMAIL, PASSWORD, function(userId) {
        var d = {name: 'test'};
        var path = '/users/' + userId + '/auths';
        requests.post(path, d, function(code, json) {
            test.equal(code, httpStatus.UNAUTHORIZED);
            requests.get(path, function(code, json) {
                test.equal(code, httpStatus.UNAUTHORIZED);
                test.done();
            });
        });
    });
};

exports.testAuthRead = function(test) {
    _createUser(EMAIL, PASSWORD, function(userId) {
        _loginUser(EMAIL, PASSWORD, function(userId) {
            var d = {name: 'test'};
            var path = '/users/' + userId + '/auths';
            requests.post(path, d, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                requests.get(path, function(code, json) {
                    test.equal(code, httpStatus.OK);
                    test.equal(json.auths.length, 1);
                    test.done();
                });
            });
        });
    });
};

exports.testLogout = function(test) {
    _createUser(EMAIL, PASSWORD, function(userId) {
        _loginUser(EMAIL, PASSWORD, function(userId) {
            var d = {name: 'test'};
            var path = '/users/' + userId + '/auths';
            requests.post(path, d, function(code, json) {
                test.equal(code, httpStatus.CREATED);
                _logoutUser(function() {
                    requests.get(path, function(code, json) {
                        test.equal(code, httpStatus.UNAUTHORIZED);
                        test.done();
                    });
                });
            });
        });
    });
};

var _createUser = function(email, password, next) {
    requests.post('/users', {
        email: email,
        password: password,
    }, function(code, json) {
        if (code === httpStatus.CREATED)  next(json.user.id);
    });
};

var _loginUser = function(username, password, next) {
    requests.post('/login', {
        username: username,
        password: password,
    }, function(code, json) {
        if (code === httpStatus.OK)  next(json.user.id);
    });
};

var _logoutUser = function(next) {
    requests.get('/logout', function(code) {
        if (code === httpStatus.NO_CONTENT)  next();
    });
};
