Restberry
=========

[![](https://img.shields.io/npm/v/restberry.svg)](https://www.npmjs.com/package/restberry) [![](https://img.shields.io/npm/dm/restberry.svg)](https://www.npmjs.com/package/restberry) [![](https://travis-ci.org/materik/restberry.svg)](https://travis-ci.org/materik/restberry)

[![NPM](https://nodei.co/npm/restberry.png?downloads=true)](https://nodei.co/npm/restberry/)

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

* [Legacy](http://thelegacy.io)
* [SalesBranch](http://sales-branch.com)

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
[`restberry-express`](https://github.com/materik/restberry-express) and [`restberry-mongoose`](https://github.com/materik/restberry-mongoose).

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

**NOTE:** See [`restberry-errors`](https://github.com/materik/restberry-errors) for possible error responses.

## Authentication

See [`restberry-auth`](https://github.com/materik/restberry-auth).

## Routing

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
            apiPath: '/api/v1',  // overrides the one set on Restberry
            actions: { },
            loginRequired: false,  // should authenticate the request
            method: 'GET',  // choices: DELETE, GET, POST, PUT
            parentModel: restberry.model('Bar'),
            path: '/path/to',  // the path of the route, will append apiPath
            postAction: function(json, req, res, next) {
                ...
            },  // will be executed after action
            preAction: function(req, res, next) {
                ...
            },  // will be executed before action
            verbose: false,  // will print the API call on initiation
        })
```

**NOTE:** you can set these properties to all the predefined API definitions,
you won't be able to override `action` however.

See [`restberry-router-crud`](https://github.com/materik/restberry-router-crud) for more info.

## Run the tests

```
npm test
```

Add the pre push hook if you want to contribute:
``
npm run addprepushhook
``

## Further reading

I have written an article series on RESTful API design which this package is base upon, you can find the three parts here:

- http://materik.tumblr.com/post/98324672516/restful-json-api-design-part-1
- http://materik.tumblr.com/post/99806761591/restful-json-api-design-part-2
- http://materik.tumblr.com/post/101938795476/restful-json-api-design-part-3

## Contact

I'm really interested to here what you guys think of Restberry, especially if
you have any suggestions to improve the package. Please contact me at
thematerik@gmail.com.
