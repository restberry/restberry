How to build a backend service with Restberry
=============================================

We would like to build a backend service for our weather app consisting of two
models: Weather and City, where City can have multiple Weather objects connected
to it.

You should be able to add new City objects and then add Weather objects to a
City over time. The app should then be able to get a list of Weather objects
from a City.

We need a CRUD API to achieve this with the following API routes:

- Create a city: POST /cities
- Add a weather to a city: POST /cities/:id/weathers
- Get info of a city: GET /cities/:id
- Get weather from a city: GET /cities/:id/weathers

This is a perfect time to use Restberry!

------

Let's start by defining our ``package.json`` file and our dependencies:

```
{
    "dependencies": {
        "restberry": "0.3.x",
        "restberry-express": "0.3.x",
        "restberry-mongoose": "0.3.x"
    }
}
```

We are going to use ``express`` as our web framework and ``mongoose`` as our ODM.

Now we can define our main ``app.js`` file, start by importing the dependencies:

```
var restberry = require('restberry');
var restberryExpress = require('restberry-express');
var restberryMongoose = require('restberry-mongoose');
```

Next we need to setup our restberry object. First we are able to configure the
app the way we like:

```
restberry
    .config({
        apiPath: '/api/v1',
        env: 'prod',
        name: 'WEATHER APP'
        port: 5000,
    })
```

Here I want every path to start with ``/api/v1`` and I want the port to be
``5000``. The env and name properties will only show up in the log so to easily
identify the environment.

Next we want to let restberry know that we want to use ``express`` and how we
want to configure it.

```
restberry
    .use(restberryExpress.use(function(waf) {
        var app = waf.app;
        var express = waf.express;
        app.configure(function() {
            app.use(express.json());
            app.use(express.urlencoded());
        });
    })
```

The callback from the ``restberryExpress`` use call is a web application
framework object, ``waf``, containing express and an express object: ``app``.
Inside this callback you can setup your service the way you like.

Now we want to let restberry know that we also like to use ``mongoose``.

```
restberry
    .use(restberryMongoose.use(function(odm) {
        odm.connect('mongodb://localhost/weather-app');
    })
```

Here we would just like to set the path to our mongodb database.

Now we can create our models:

................
