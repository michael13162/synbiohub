
var async = require('async')

var sparql = require('./sparql')

async function sparql(graphUris, query, callback) {

    let results = await Promise.all(graphUris.map(
                (graphUri) => sparql.queryJson(query, graphUri)))

    return collateResults(results)

    function collateResults(results) {

        var collatedResults = []

        results.forEach((resultSet) => {

            [].push.apply(collatedResults, resultSet)

        })

        return Promise.resolve(collatedResults)

    }

}

module.exports = sparql



