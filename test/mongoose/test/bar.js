var _ = require('underscore');
var restberry = require('../app');
var testlib = require('../testlib');

exports.setUp = testlib.setupTeardown;
exports.tearDown = testlib.setupTeardown;

exports.testCreate = function(test) {
    var Bar = restberry.model('Bar');
    Bar.create({name: 'test'}, function(bar) {
        test.equal(bar.name, 'test');
        test.done();
    });
};

exports.testUpdate = function(test) {
    var Bar = restberry.model('Bar');
    Bar.create({name: 'test'}, function(bar) {
        bar.name = 'testname';
        bar.save(function(bar) {
            test.equal(bar.name, 'testname');
            test.done();
        });
    });
};

exports.testUpdateName = function(test) {
    var Bar = restberry.model('Bar');
    Bar.create({name: 'test'}, function(bar) {
        bar.setName('testname', function(bar) {
            test.equal(bar.name, 'testname');
            test.done();
        });
    });
};

exports.testGet = function(test) {
    var Bar = restberry.model('Bar');
    Bar.create({name: 'test'}, function(bar) {
        var barId = bar.id;
        Bar.findById(barId, function(bar) {
            test.equal(bar.name, 'test');
            test.done();
        });
    });
};

exports.testGetMany = function(test) {
    var Bar = restberry.model('Bar');
    Bar.create({name: 'test1'}, function() {
        Bar.create({name: 'test2'}, function() {
            Bar.find({}, function(bars) {
                bars = _.toArray(bars);
                test.equal(bars.length, 2);
                var objs = _.pluck(bars, '_obj');
                var names = _.pluck(objs, 'name');
                test.deepEqual(['test1', 'test2'], names);
                test.done();
            });
        });
    });
};

exports.testDelete = function(test) {
    var Bar = restberry.model('Bar');
    Bar.create({name: 'test'}, function(bar) {
        bar.remove(function() {
            Bar.find({}, function(bars) {
                test.equal(bars.length, 0);
                test.done();
            });
        });
    });
};

exports.testDone = function(test) {
    test.done();
    restberry.odm.mongoose.disconnect();
};
