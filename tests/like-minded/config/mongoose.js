var DB = 'mongodb://localhost/like-minded';

module.exports = function(odm) {
    odm.connect(DB);
};
