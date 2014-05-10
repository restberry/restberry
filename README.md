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
