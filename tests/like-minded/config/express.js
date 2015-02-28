module.exports = function(waf) {
    var app = waf.app;
    var express = waf.express;
    app.configure(function() {
        app.use(express.json());
        app.use(express.urlencoded());
        app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    });
};
