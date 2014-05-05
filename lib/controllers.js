exports.read = function(req, res, m, next) {
    n.findByIdAndVerify(req, res, req.params.id, function(obj) {
        obj.toJSON(req, res, true, function(json) {
            next(json);
        });
    })
};

exports.readMany = function(req, res, m, n, next) {
    var findM = function(query) {
        m.findAndVerify(req, res, query, function(objs) {
            m.toJSONs(req, res, objs, function(json) {
                next(json);
            });
        });
    };
    if (n) {
        n.findByIdAndVerify(req, res, req.params.id, function(obj) {
            var d = [];
            d[n.singleName] = obj.id;
            next(d);
        })
    } else {
        findM({});
    }
};

exports.create = function(req, res, m, n, next) {
    var createM = function(data) {
        req.expand.push(m.singleName);
        m.createAndVerify(req, res, data, function(obj) {
            obj.toJSON(req, res, true, function(json) {
                res.status(http.CREATED);
                next(json);
            });
        });
    };
    var data = _.clone(req.body);
    if (n) {
        n.findByIdAndVerify(req, res, req.params.id, function(obj) {
            data[n.singleName] = obj.id;
            createM(data);
        });
    } else {
        createM(data);
    }
};
