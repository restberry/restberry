var _ = require('underscore');
var _s = require('underscore.string');

var DEFAULT_EXPAND = [];
var DEFAULT_FIELDS = [];
var DEFAULT_LIMIT = 10;
var DEFAULT_OFFSET = 0;
var DEFAULT_SORT = {timestampCreated: -1};
var QS_VALUE_SPLIT = ',';
var SORT_REVERSE = '-';

function RestberryOptions(req) {
    this._req = req;
    this.expand = this._extractExpand();
    this.fields = this._extractFields();
    this.limit = this._extractLimit();
    this.offset = this._extractOffset();
    this.sort = this._extractSort();
};

RestberryOptions.prototype._extractExpand = function() {
    req = this._req || {};
    var query = req.query || {};
    return (query.expand ?
                query.expand.split(QS_VALUE_SPLIT) :
                _.clone(DEFAULT_EXPAND));
};

RestberryOptions.prototype._extractFields = function() {
    req = this._req || {};
    var query = req.query || {};
    return (query.fields ?
                query.fields.split(QS_VALUE_SPLIT) :
                _.clone(DEFAULT_FIELDS));
};

RestberryOptions.prototype._extractLimit = function() {
    req = this._req || {};
    var query = req.query || {};
    return (query.limit ? query.limit : DEFAULT_LIMIT);
};

RestberryOptions.prototype._extractOffset = function() {
    req = this._req || {};
    var query = req.query || {};
    return (query.offset ? query.offset : DEFAULT_OFFSET);
};

RestberryOptions.prototype._extractSort = function() {
    req = this._req || {};
    var query = req.query || {};
    var sort = DEFAULT_SORT;
    if (query.sort) {
        sort = {};
        var sorts = query.sort.split(QS_VALUE_SPLIT);
        for (i in sorts) {
            var reqSort = sorts[i];
            if (_s.startsWith(reqSort, SORT_REVERSE)) {
                reqSort = _s.splice(reqSort, 0, 1);
                sort[reqSort] = -1;
            } else {
                sort[reqSort] = 1;
            };
        };
    };
    return sort;
};

RestberryOptions.prototype.addExpand = function(expand) {
    this.expand.push(expand);
};

RestberryOptions.prototype.addField = function(field) {
    this.fields.push(field);
};

RestberryOptions.prototype.addSort = function(sort) {
    var _sort = this.sort;
    this.sort = _.extend(_sort, sort);
};

RestberryOptions.prototype.copy = function() {
    var options = new RestberryOptions();
    options.setExpand(this.expand);
    options.setFields(this.fields);
    options.setLimit(this.limit);
    options.setOffset(this.offset);
    options.setSort(this.sort);
    return options;
};

RestberryOptions.prototype.popExpand = function(expand) {
    var _expand = this.expand;
    this.expand = _.without(_expand, expand);
};

RestberryOptions.prototype.popField = function(field) {
    var _fields = this.fields;
    this.fields = _.without(_fields, fields);
};

RestberryOptions.prototype.popSortKey = function(sortKey) {
    var _sort = this.sort;
    this.sort = _.omit(_sort, sortKey);
};

RestberryOptions.prototype.setExpand = function(expand) {
    this.expand = expand;
};

RestberryOptions.prototype.setFields = function(fields) {
    this.fields = fields;
};

RestberryOptions.prototype.setLimit = function(limit) {
    this.limit = limit;
};

RestberryOptions.prototype.setOffset = function(offset) {
    this.offset = offset;
};

RestberryOptions.prototype.setSort = function(sort) {
    this.sort = sort;
};

module.exports = exports = RestberryOptions;
