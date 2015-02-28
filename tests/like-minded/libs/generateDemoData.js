var fs = require('fs');
var mongoose = require('mongoose');
var restberry = require('restberry');


var TEXT_FILEPATH = __dirname + '/demoDataText.txt';
var GOOGLE_ID = '12345';
var DATA_COLLAB = {
    requester: 'Actor',
    requestee: 'Director',
    project: 'Blockbuster Movie',
    location: {
        city: 'Los Angeles',
        country: 'USA',
    },
};
var DATA_USER = {
    googleId: GOOGLE_ID,
    email: 'leo@likeminded.com',
    name: {
        full: 'Leonardo DiCaprio',
        first: 'Leonardo',
        last: 'DiCaprio',
    },
    image: 'https://lh3.googleusercontent.com/-O8_3daCcZj8/UBl1PseLEzI/' +
           'AAAAAAAAAFc/tcL0dDpk6dk/LD_TwitterPic%255B1%255D.jpg',
    gender: 'male',
};

exports.generateDemoData = function(next) {
    var self = this;
    self.createDemoUser(function(user) {
        self.createCollab(user, function(requeste) {
            next();
        });
    });
};

exports.createCollab = function(user, next) {
    var Collab = mongoose.model('Collab');
    _readFile(TEXT_FILEPATH, function(text) {
        var d = DATA_COLLAB;
        d.user = user.id;
        d.desc = text;
        var request = new Collab(d);
        request.save(_handleErr(next));
    });
};

exports.createDemoUser = function(next) {
    var User = mongoose.model('User');
    var d = {googleId: GOOGLE_ID};
    User.find(d, _handleErr(function(objs) {
        restberry.utils.forEachAndDone(objs, function(obj, iter) {
            var Collab = mongoose.model('Collab');
            Collab.find({user: obj.id}, _handleErr(function(objs) {
                restberry.utils.forEachAndDone(objs, function(obj, iter) {
                    obj.remove(_handleErr(iter));
                }, function() {
                    obj.remove(_handleErr(iter));
                });
            }));
        }, function() {
            var user = new User(DATA_USER);
            user.save(_handleErr(next));
        });
    }));
};

var _handleErr = function(next) {
    return function(err, o) {
        if (err)  console.log(err);
        next(o);
    };
};

var _readFile = function(filepath, next) {
    var input = fs.createReadStream(filepath);
    var text = '';
    input.on('data', function(data) {
        text += data;
    });
    input.on('end', function() {
        if (text.length) {
            next(text);
        };
    });
};
