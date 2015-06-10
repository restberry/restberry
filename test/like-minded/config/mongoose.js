var DB = 'mongodb://localhost/restberry-test';

module.exports = function(odm) {
    odm.connect(DB);
};
