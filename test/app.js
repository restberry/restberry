var express = require('express');
var restberry = require('restberry');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');

var app = express();
restberry.init({
    apiPath: '/api/v1'
});

var port = process.env.NODE_PORT | 5000;
app.listen(port);

// Test

var parentschema = new mongoose.Schema({
    name: {type: String},
});
parent = restberry.model(mongoose, 'Parent', 'Parents', parentschema);

var childschema = new mongoose.Schema({
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Parent'},
    name: {type: String},
});
child = restberry.model(mongoose, 'Child', 'Children', childschema);

restberry.readAPI(app, child);
restberry.readManyAPI(app, child, parent);
restberry.createAPI(app, child, parent);
restberry.readManyAPI(app, parent);
restberry.createAPI(app, parent);
