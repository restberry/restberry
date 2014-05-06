var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var restberry = require('restberry');


var DB = 'mongodb://localhost/npm-restberry-test';
mongoose.connect(DB);

var app = express();
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.session({
    secret: 'restberry secret',
}));
app.use(passport.initialize());
app.use(passport.session());
app.listen(5000);

restberry.config({
    apiPath: '/api/v1',
});

var userSchema = new mongoose.Schema({
    username: {type: String},
    password: {type: String},
});
var userModel = restberry.model(mongoose, 'User', userSchema);
restberry.routes.create(app, userModel);
restberry.enableAuth(app, passport, userModel);

var parentSchema = new mongoose.Schema({
    name: {type: String, unique: true},
});
var parentModel = restberry.model(mongoose, 'Parent', parentSchema);
restberry.routes.readMany(app, parentModel);
restberry.routes.create(app, parentModel);
restberry.routes.del(app, parentModel);

var childSchema = new mongoose.Schema({
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Parent'},
    name: {type: String},
});
var childModel = restberry.model(mongoose, 'Child', childSchema);
restberry.routes.read(app, childModel);
restberry.routes.readMany(app, childModel, parentModel);
restberry.routes.create(app, childModel, parentModel);
restberry.routes.del(app, childModel);

var authSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: {type: String},
});
var authModel = restberry.model(mongoose, 'Auth', authSchema);
restberry.routes.readMany(app, authModel, userModel, true);
restberry.routes.create(app, authModel, userModel, true);

console.log('running on 5000');
