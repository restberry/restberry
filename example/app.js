var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');

restberry
    .config({
        apiPath: '/api/v1',
        env: 'prod',
        name: 'WEATHER APP',
        port: 5000,
    })
    .use(restberryExpress.use(function(waf) {
        var app = waf.app;
        var express = waf.express;
        app.configure(function() {
            app.use(express.json());
            app.use(express.urlencoded());
        });
    })
    .use(restberryMongoose.use(function(odm) {
        odm.connect('mongodb://localhost/weather-app');
    })
    .listen();

restberry.model('City')
    .schema({
        name: {type: String, required: true},
        location: {
            longitude: {type: Number},
            latitude: {type: Number},
        },
    })
    .routes
        .addCreateRoute()  // POST /api/v1/cities
        .addReadRoute()  // GET /api/v1/cities/:id
        .addReadManyRoute()  // GET /api/v1/cities

var CONDITIONS = [
    'Cloudy',
    'Rainy',
    'Sunny',
];
restberry.model('Weather')
    .schema({
        city: {type: restberry.odm.ObjectId, ref: 'City', required: true},
        date: {type: Date, default: Date.now},
        tempature: {type: Number, required: true},
        condition: {type: String, enum: CONDITIONS, required: true},
    })
    .routes
        .addCreateRoute({  // POST /api/v1/cities/:id/weathers
            parentModel: restberry.model('City'),
        })
        .addReadRoute()  // GET /api/v1/weathers/:id
        .addReadManyRoute({  // GET /api/v1/cities/:id/weathers
            parentModel: restberry.model('City'),
        })
