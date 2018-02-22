var Bluebird = require('bluebird');
var db = require('../lib/db');

module.exports = {
    up: (query, DataTypes) => {
        return Promise.all([db.model.Group.sync(), db.model.Membership.sync()])
    },

    down: (query, DataTypes) => {
        return Promise.all([db.model.Group.drop(), db.model.Membership.drop()])
    }
};