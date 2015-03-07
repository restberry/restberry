How to build a backend service with Restberry
=============================================

We would like to build a backend service for our weather app consisting of two
models: Weather and City, where City can have multiple Weather objects connected
to it.

You should be able to add new City objects and then add Weather objects to a
City over time. The app should then be able to get a list of Weather objects
from a City.

We need a CRUD API to achieve this with the following API routes:

- **Create a city:** POST /cities
- **Add a weather to a city:** POST /cities/:id/weathers
- **Get info of a city:** GET /cities/:id
- **Get weather from a city:** GET /cities/:id/weathers

This is a perfect time to use **Restberry**!

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

The last thing we have to do is to startup the service by calling ``listen`` of the restberry object:

```
restberry.listen()
```

Now we can finally create our models. A model is always recieved and created by calling the ``model`` method of restberry:

```
restberry.model('City')
```

Let's define the mongodb schema for this model:

```
restberry.model('City')
    .schema({
        name: {type: String, required: true},
        location: {
            longitude: {type: Number},
            latitude: {type: Number},
        },
    })
```

Pretty straight forward. Now we need to define the API routes for the mode, normally the hardest and most time consuming part of setting up a backend service, but not with Restberry.

```
restberry.model('City')
    .routes
        .addCreateRoute()  // POST /api/v1/cities
        .addReadRoute()  // GET /api/v1/cities/:id
```

That is it! Here we have added two routes to the City model, a create route and a read route. These routes handle bad requests, not found, formatting, status codes, and more. Simple as that.

We go about creating the Weather model in the same way:

```
restberry.model('Weather')
    .schema({
        city: {type: restberry.odm.ObjectId, ref: 'City', required: true},
        date: {type: Date, default: Date.now},
        tempature: {type: Number, required: true},
        condition: {type: String, required: true},
    })
    .routes
        .addCreateRoute({  // POST /api/v1/cities/:id/weathers
            parentModel: restberry.model('City'),
        })
        .addReadManyRoute({  // GET /api/v1/cities/:id/weathers
            parentModel: restberry.model('City'),
        })
```

The only difference here is that we are setting the ``parentModel`` property when creating the routes. Restberry will automatically correspond the ``parentModel`` with the ``city`` property of the model object and when creating a weather object set ``city`` automatically with the City object, with the ``id``, in the route.

We are all done! Now you can checkout the ``app.js`` file of this example or you can have a look through the tests. Otherwise go out and create an app of your own.
