var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
var testlib = require(process.env.NODE_PATH + '/testlib');


restberry
    .config({
        apiPath: '/api/v1',
        port: process.env.NODE_PORT || 6000,
        verbose: true,
    })
    .use(restberryExpress.use())
    .use(restberryMongoose.use(function(odm) {
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
            parentModel: restberry.model('Bar'),
        })
        .addReadRoute()
        .addReadManyRoute({
            parentModel: restberry.model('Bar'),
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

testlib.enableClearData(restberry);
