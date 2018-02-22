
var sha1 = require('sha1');
var config = require('./config')

module.exports = {
    createTriplestoreID: function(username) {
        return 'user/' + username
    },
    createTriplestoreGroup: function(groupId) {
        return 'group/' + groupId
    }
}


