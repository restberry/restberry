var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var testlib = require('../testlib');

restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .use(restberryExpress)
    .use(restberryMongoose.config(function(odm) {
        odm.connect('mongodb://localhost/restberry-test');
    }))
    .listen('RESTBERRY');

restberry.model('Bar')
    .schema({
        name: {type: String, unique: true},
        timestampUpdated: {type: Date, default: new Date(), uneditable: true},
        timestampCreated: {type: Date, default: new Date(), uneditable: true},
    })
    .routes.addCRUDRoutes();

restberry.model('Foo')
    .schema({
        bar: {type: restberry.odm.ObjectId, ref: 'Bar'},
        name: {type: String},
    })
    .routes
        .addCreateRoute({
            parentModel: 'Bar',
        })
        .addReadRoute()
        .addReadManyRoute({
            parentModel: 'Bar',
        })

restberry.model('Baz')
    .schema({
        nested: {
            obj: {type: restberry.odm.ObjectId, ref: 'Baz'},
        },
    })
    .routes
        .addCreateRoute()
        .addPartialUpdateRoute()
        .addReadRoute()

restberry.model('FooBar')
    .schema({
        list: [
            {
                a: {type: Number},
                b: {type: String},
            }
        ],
    })
    .routes
        .addCreateRoute()
        .addReadManyRoute()

testlib.enableClearData(restberry);
