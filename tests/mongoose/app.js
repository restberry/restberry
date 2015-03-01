var restberry = require('restberry');
var restberryMongoose = require('restberry-mongoose');

restberry
    .config({
        verbose: true,
    })
    .use(restberryMongoose.use(function(odm) {
        odm.connect('mongodb://localhost/restberry-test');
    }));

restberry.model('Bar')
    .schema({
        name: {type: String, unique: true},
        timestampCreated: {type: Date, default: new Date(), uneditable: true},
    })
    .methods({
        setName: function(name, next) {
            this.set('name', name);
            this.save(next);
        },
    });

module.exports = restberry;
