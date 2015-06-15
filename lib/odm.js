var _ = require('underscore');

function RestberryODM(module) {
    _.extend(this, module);
}

RestberryODM.prototype.setRestberry = function(restberry) {
    this.restberry = restberry;
};

/**
 * RestberryODM.prototype.connect
 *
 * Connect the odm to a certain database.
 *
 * @param {String} dbname
 * @return {RestberryODM} this
 */

/**
 * RestberryODM.prototype.find
 *
 * Find objects matching the query with certain options.
 *
 * @param {Model} model
 * @param {Object} query
 * @param {Object} options
 * @param {Function} callback
 */

/**
 * RestberryODM.prototype.findById
 *
 * Find an object by id.
 *
 * @param {Model} model
 * @param {String} id
 * @param {Function} callback
 */

/**
 * RestberryODM.prototype.findOne
 *
 * Find one object matching the query
 *
 * @param {Model} model
 * @param {Object} query
 * @param {Function} callback
 */

/**
 * RestberryODM.prototype.get
 *
 * Getting a model with a certain name.
 *
 * @param {String} name
 * @return {Model} model
 */

/**
 * RestberryODM.prototype.getFieldNamesAll
 *
 * Getting a list of all field names.
 *
 * @param {Model} model
 * @return {Array} fieldNames
 */

/**
 * RestberryODM.prototype.getFieldNamesEditable
 *
 * Getting a list of field names that are editable.
 *
 * @param {Model} model
 * @return {Array} fieldNames
 */

/**
 * RestberryODM.prototype.getFieldNamesHidden
 *
 * Getting a list of field names that are hidden.
 *
 * @param {Model} model
 * @return {Array} fieldNames
 */

/**
 * RestberryODM.prototype.getFieldsOfModels
 *
 * Getting a list of fields connected to the specified model.
 * The object return should have the following structure:
 * [{
 *     fieldName: {String},
 *     model: {RestberryModel},
 * }]
 *
 * @param {Model} model
 * @param {Function} callback
 */

/**
 * RestberryODM.prototype.isConflictError
 *
 * Given an error dict, determine if the error is a conflict error or not.
 *
 * @param {Object} err
 * @return {Boolean} isConflictError
 */

/**
 * RestberryODM.prototype.isNotFoundError
 *
 * Given an error dict, determine if the error is a not found error or not.
 *
 * @param {Object} err
 * @return {Boolean} isNotFoundErrors
 */

/**
 * RestberryODM.prototype.pluralName
 *
 * Returns the name of the model in plural form
 *
 * @param {Model} model
 * @return {String} name
 */

/**
 * RestberryODM.prototype.remove
 *
 * Remove an object.
 *
 * @param {Obj} obj
 * @param {Function} callback
 */

/**
 * RestberryODM.prototype.save
 *
 * Saving an object.
 *
 * @param {Obj} obj
 * @param {Function} callback
 */

/**
 * RestberryODM.prototype.set
 *
 * Creating a model with a certain name and schema.
 *
 * @param {String} name
 * @param {Object} schema
 * @return {Model} model
 */

/**
 * RestberryODM.prototype.schema
 *
 * Creating a schema of the odm.
 *
 * @param {Object} schema
 * @return {Schema} schema
 */

/**
 * RestberryODM.prototype.singularName
 *
 * Returns the name of the model in singular form
 *
 * @param {RestberryModel} model
 * @return {String} name
 */

/**
 * RestberryODM.prototype.toObject
 *
 * Returns a dict representation of the object.
 *
 * @param {Object} obj
 * @return {Object} dict
 */

/**
 * RestberryODM.prototype.use
 *
 * Activates the odm and return itself in a callback for the user
 * to set custom settings.
 *
 * @param {Function} callback
 * @return {RestberryODM} this
 */

RestberryODM.canApply = function(odm) {
    return _.isFunction(odm.config) &&
           _.isFunction(odm.connect) &&
           _.isFunction(odm.find) &&
           _.isFunction(odm.findById) &&
           _.isFunction(odm.findOne) &&
           _.isFunction(odm.get) &&
           _.isFunction(odm.getFieldNamesAll) &&
           _.isFunction(odm.getFieldNamesEditable) &&
           _.isFunction(odm.getFieldNamesHidden) &&
           _.isFunction(odm.getFieldsOfModels) &&
           _.isFunction(odm.isConflictError) &&
           _.isFunction(odm.isNotFoundError) &&
           _.isFunction(odm.pluralName) &&
           _.isFunction(odm.remove) &&
           _.isFunction(odm.save) &&
           _.isFunction(odm.set) &&
           _.isFunction(odm.schema) &&
           _.isFunction(odm.singularName) &&
           _.isFunction(odm.toObject);
};

module.exports = exports = RestberryODM;
