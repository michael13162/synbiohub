
let sha1 = require('sha1');
let config = require('./config');

exports.createTriplestoreID = function createTriplestoreID(username) {
return 'user/'+username;
};


