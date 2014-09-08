Restberry
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

* Sales-Branch (http://sales-branch.com)
* Like-Minded (http://like-minded.materik.me)

**NOTE:** Let me know if you want your app to be put on this list.

## Usage

```
var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var resbterryMongoose = require('restberry-mongoose');

restberry
    .config({
        apiPath: '/api/v1',
        port: '',
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
    .routes.addCRUD();

restberry.model('Bar')
    .schema({
        foo: {type: restberry.odm.ObjectId, ref: 'Foo'},
        name: {type: String},
    })
    .routes.addCRUD({
        parentModel: restberry.model('Foo'),
    });

```

**NOTE:** See more usages in the test app and dependent packages like:
restberry-express, restberry-mongoose, restberry-router.

## Authentication

See `restberry-auth`.

## Response examples

All these responses below are automatically handled without needing to write any
additional code.

* **200** OK
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

* **201** CREATED
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

* **204** NO CONTENT
```
2014-05-11T11:55:52.575Z|172.16.122.129|DELETE|</api/v1/foos/536f6548e88ad2b5a71ffdb7> <{}>
2014-05-11T11:55:52.579Z|172.16.122.129|204|
```

**NOTE:** See `restberry-erros` for possible error responses.

## Routing

See `restberry-router`

## Run the tests

```
$ npm test
```

## Contact

I'm really interested to here what you guys think of Restberry, especially if
you have any suggestions to improve the package. Please contact me at
thematerik@gmail.com.
