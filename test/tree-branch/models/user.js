var _ = require('underscore');
var _s = require('underscore.string');
var config = require('../config/config');
var errors = require('restberry-errors');


var GEN_PASSWORD_LEN = 8;
var GEN_PASSWORD_CHARS = 'qwertyuiopasdfghjklzxcvbnm' +
                         'QWERTYUIOPASDFGHJKLZXCVBNM' +
                         '1234567890';

module.exports = function(restberry) {
    restberry.model('User')
        .methods({
            getName: function() {
                var name;
                if (this.name) {
                    var firstName = this.get('name').first;
                    if (!firstName)  firstName = '';
                    var lastName = this.get('name').last;
                    if (!lastName)  lastName = '';
                    name = _s.trim(firstName + ' ' + lastName);
                }
                if (!name)  name = _.first(this.get('email').split('@'));
                return name;
            },
        })
        .statics({
            excludeSelf: function(req, res, next) {
                var User = restberry.model('User');
                var query = {_id: {$ne: req.user.getId()}};
                User.find(query, function(users) {
                    users.toJSON(next);
                });
            },

            generatePassword: function(n, a) {
                if (n === undefined || n === null)  n = GEN_PASSWORD_LEN;
                if (n === 0)   return '';
                a = a || GEN_PASSWORD_CHARS;
                var index = (Math.random() * (a.length - 1)).toFixed(0);
                return a[index] + this.generatePassword(n - 1, a);
            },

            inviteUser: function(req, res, next) {
                var onError = restberry.waf.handleRes; 
                var Org = restberry.model('Organization');
                var User = restberry.model('User');
                var email = req.body.email;
                if (!email) {
                    var err = {message: 'Missing email'};
                    restberry.onError(errors.BadRequest, err);
                    return;
                }
                var user, org;
                var getOrg = function(next) {
                    var orgId = req.body.organizationId;
                    if (orgId) {
                        Org.findById(orgId, function(_org) {
                            org = _org;
                            next();
                        });
                    } else {
                        next();
                    }
                };
                var createUser = function(next) {
                    var d = {
                        email: email,
                        password: User.generatePassword(),
                    };
                    User.create(d, function(_user) {
                        user = _user;
                        if (org) {
                            org.get('members').push(user.getId());
                            org.save(next);
                        } else {
                            next();
                        }
                   });
                };
                var sendEmail = function(next) {
                    var fromUser = req.user.getName();
                    console.log('send email to ', email, 'from', fromUser);
                    next();
                };
                var returnUser = function(next) {
                    user.options().addExpand('user');
                    user.toJSON(next);
                };
                getOrg(function() {
                    createUser(function() {
                        sendEmail(function() {
                            returnUser(next);
                        });
                    });
                });
            },

            me: function(req, res, next) {
                req.user.options().addExpand('user');
                req.user.toJSON(next);
            },
        })

        .routes
            .addCreateRoute({
                actions: {
                    'invite-user': restberry.model('User').inviteUser,
                },
                isLoginRequired: false,
            })
            .addPartialUpdateRoute()
            .addReadManyRoute({
                actions: {
                    'exclude-self': restberry.model('User').excludeSelf,
                    me: restberry.model('User').me,
                },
            })
};
