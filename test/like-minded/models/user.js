module.exports = function(restberry) {
    restberry.auth.getUser()
        .methods({
            getNbrOfCollabs: function(next) {
                var Collab = restberry.model('Collab');
                var query = {user: this.getId()};
                Collab.find(query, function(collabs) {
                    next(collabs.length);
                });
            },
        })

        .loginRequired()

        .routes
            .addCreateRoute({
                isLoginRequired: false,
            })
            .addPartialUpdateRoute()
            .addReadManyRoute({
                actions: {
                    me: function(req, res, next) {
                        req.user.expandJSON();
                        req.user.toJSON(function(json) {
                            req.user.getNbrOfCollabs(function(nbr) {
                                json.user.nbrOfCollabs = nbr;
                                next(json);
                            });
                        });
                    },
                },
            });
};
