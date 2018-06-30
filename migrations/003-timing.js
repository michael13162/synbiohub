const Bluebird = require('bluebird');
const loadTemplate = require('../lib/loadTemplate');
const db = require('../lib/db');
const config = require('../lib/config');
const sparql = require('../lib/sparql/sparql');

module.exports = {
    up: (query, DataTypes) => {
        db.model.Tick.sync();
    },

    down: (query, DataTypes) => {
        db.model.Tick.drop();
    }
}
