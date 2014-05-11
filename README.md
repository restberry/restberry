restberry
=========

Framework for setting up RESTful APIs. Define your models and setup CRUD API
calls without needing to write any code (see Usage). All API calls will handle
and identify issues and throw necessary HTTP responses and easy to debug error
responses:

## Install

```
npm install restberry
```

## Usage

```
var restberry = require('restberry');
var express = require('express');
var mongoose = require('mongoose');

var app = express();
restberry.config({
    apiPath: '/api/v1',
    port: 5000,
});
restberry.listen(app);

var FooSchema = new mongoose.Schema({
    name: {type: String},
});
var Foo = restberry.model(app, 'Foo', FooSchema);

var BarSchema = new mongoose.Schema({
    foo: {type: mongoose.Schema.Types.ObjectId, ref: 'Foo'},
    name: {type: String},
});
var Bar = restberry.model(app, 'Bar', BarSchema);

restberry.routes.create(app, Foo);  // POST /api/v1/foos
restberry.routes.read(app, Bar);  // GET /api/v1/bars/:id
restberry.routes.readMany(app, Bar, Foo);  // GET /api/v1/foos/:id/bars
restberry.routes.create(app, Bar, Foo);  // POST /api/v1/foos/:id/bars
restberry.routes.del(app, Bar);  // DELETE /api/v1/bars/:id
```

**NOTICE** See more usages in the test app.

## Route Hooks

When defining routes there are two hooks you can specify for manipulating
data or handling responses.

```
preAction = function(req, res, next) { 
    ...
    next();
}
postAction = function(json, req, res, next) {
    ...
    next(json);
}
```

You specify the hooks by supplying it to the API definition, with this you can
also supply:

 * **authenticate**: if true, the app will verify that you are logged in and that you have permission to manipulate the object.
 * **actions**: define actions that will happen if an api call is made with the specified query string action.

```
restberry.routes.read(app, Bar, {
    preAction: function(req, res, next) { ... },
    postAction: function(json, req, res, next) { ... },
    authenticate: true,
    actions: {
        // This action will be triggered if ?action=action-value
        'action-value': function(req, res, next) { ... },
    },
});
```

## Response Examples

All these responses below are automatically handled without needing to write any
additional code.

* 200: OK
```
2014-05-11T11:55:53.916Z|172.16.122.129|GET|</api/v1/foos/536f6549e88ad2b5a71ffdc6> <{}>
2014-05-11T11:55:53.920Z|172.16.122.129|200|<{
  "foo": {
    "href": "/api/v1/foos/536f6549e88ad2b5a71ffdc7",
    "id": "536f6549e88ad2b5a71ffdc7",
    "name": "test"
  }
}>
```
* 201: CREATED
```
2014-05-11T11:55:54.210Z|172.16.122.129|POST|</api/v1/foos> <{
  "name": "test"
}>
2014-05-11T11:55:54.210Z|172.16.122.129|201|<{
  "foo": {
    "href": "/api/v1/foos/536f654ae88ad2b5a71ffdcb",
    "id": "536f654ae88ad2b5a71ffdcb",
    "name": "test"
  }
}>
```

## Run the tests

```
$ cd test
$ npm install
$ ./node_modules/nodeunit/bin/nodeunit ./tests
```

**NOTICE** Don't forget to run the test app: $ node app
