Restberry ![](https://img.shields.io/npm/v/restberry.svg) ![](https://img.shields.io/npm/dm/restberry.svg) ![](https://travis-ci.org/materik/restberry.svg)
=========

Framework for setting up RESTful APIs. Define your models and setup CRUD API
calls without needing to write any code (see Usage). All API calls will handle
and identify issues and throw necessary HTTP responses and easy to debug error
responses. Restberry also handles authentication and permission checks and
throws appropriate errors.

## Install

```
npm install restberry
```

## Apps using Restberry in production

* Legacy (http://thelegacy.io)

**NOTE:** Let me know if you want your app to be put on this list.

## Usage

```
var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var resbterryMongoose = require('restberry-mongoose');

restberry
    .config({
        apiPath: '/api/v1',
        port: 5000,
    })
    .use(restberryExpress.use(function(waf) {
        ...
    }))
    .use(restberryMongoose.use(function(odm) {
        ...
    }))
    .listen();

restberry.model('Foo')
    .schema({
        name: {type: String},
    })
    .routes.addCRUDRoutes();

restberry.model('Bar')
    .schema({
        foo: {type: restberry.odm.ObjectId, ref: 'Foo'},
        name: {type: String},
    })
    .routes.addCRUDRoutes({
        parentModel: restberry.model('Foo'),
    });

```

**NOTE:** See more usages in the tests and dependent packages like:
restberry-express and restberry-mongoose.

## Response examples

All these responses below are automatically handled without needing to write any
additional code.

* **200** OK
```
2014-05-11T11:55:53.916Z|172.16.122.129|GET|/api/v1/foos/536f6549e88ad2b5a71ffdc6|<{}>
2014-05-11T11:55:53.920Z|172.16.122.129|200|<{
  "foo": {
    "href": "/api/v1/foos/536f6549e88ad2b5a71ffdc7",
    "id": "536f6549e88ad2b5a71ffdc7",
    "name": "test"
  }
}>
```

* **201** CREATED
```
2014-05-11T11:55:54.210Z|172.16.122.129|POST|/api/v1/foos|<{
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

* **204** NO CONTENT
```
2014-05-11T11:55:52.575Z|172.16.122.129|DELETE|/api/v1/foos/536f6548e88ad2b5a71ffdb7|<{}>
2014-05-11T11:55:52.579Z|172.16.122.129|204|
```

**NOTE:** See `restberry-errors` for possible error responses.

## Authentication

See `restberry-auth`.

## Routing

See `restberry-router-crud`, it's applied by default but other routes can be used by
applying: ``restberryRouter.use(require('restberry-router-*'));``

Example:

```
restberry.model('Foo')
    .routes
        .addCreateRoute()  // POST /foos
```

Handle action query strings like this:

```
restberry.model('Foo')
    .routes
        .addPartialUpdateRoutes({
            actions: {
                build: function(req, res, next) {
                    ...
                },  // POST /foos/:id?action=build
            },
        })
```

And Handle parent models like this:

```
restberry.model('Foo')
    .routes
        .addCreateRoutes({
            parentModel: restberry.model('Bar'),
        })  // POST /bars/:id/foos
```

**NOTE:** this can only be applied to ReadMany and Create.

You can also create custom routes. The possible configurations you can make are:

```
restberry
    .routes
        .addCustomRoutes({
            action: function(req, res, next) {
                ...
            },
            apiPath: '/api/v1',  // overrides the one set to Restberry
            actions: { },
            loginRequired: false,  // should authenticate the request
            method: 'GET',  // choices: DELETE, GET, POST, PUT
            parentModel: restberry.model('Bar'),
            path: '/path/to',
            postAction: function(json, req, res, next) {
                ...
            },  // will be execated after action
            preAction: function(req, res, next) {
                ...
            },  // will be execated before action
            verbose: false,  // will print the API call on initiation
        })
```

**NOTE:** you can set these properties to all the predefined API definitions,
you won't be able to override `action` however.

## Run the tests

```
npm test
```

## Contact

I'm really interested to here what you guys think of Restberry, especially if
you have any suggestions to improve the package. Please contact me at
thematerik@gmail.com.
