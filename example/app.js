var restberry = require('restberry');

restberry
    .config({
        apiPath: '/api/v1',
        env: 'prod',
        name: 'WEATHER APP',
        port: 5000,
    })
    .use('express')
    .use('mongoose', function(odm) {
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
        .addReadRoute();  // GET /api/v1/cities/:id

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
            parentModel: 'City',
        })
        .addReadManyRoute({  // GET /api/v1/cities/:id/weathers
            parentModel: 'City',
        });
