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

restberry.config({
    apiPath: '/api/v1',
    port: 5000,
});
restberry.listen(app);

restberry.enableAuth(app, passport, mongoose);
var User = mongoose.model('User');
restberry.routes.create(app, User);

var parentSchema = new mongoose.Schema({
    name: {type: String, unique: true},
});
var Parent = restberry.model(mongoose, 'Parent', parentSchema);
restberry.routes.readMany(app, Parent);
restberry.routes.create(app, Parent);
restberry.routes.del(app, Parent);

var childSchema = new mongoose.Schema({
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Parent'},
    name: {type: String},
});
var Child = restberry.model(mongoose, 'Child', childSchema);
restberry.routes.read(app, Child);
restberry.routes.readMany(app, Child, Parent);
restberry.routes.create(app, Child, Parent);
restberry.routes.del(app, Child);

var authSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: {type: String},
});
var Auth = restberry.model(mongoose, 'Auth', authSchema);
restberry.routes.readMany(app, Auth, User, {authenticate: true});
restberry.routes.create(app, Auth, User, {authenticate: true});
