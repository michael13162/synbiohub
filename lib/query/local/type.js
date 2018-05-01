
const sparql = require('../../sparql/sparql')
const assert = require('assert')

async function getType(uri, graphUri) {

    assert(!Array.isArray(graphUri))

    let result = await sparql.queryJson('SELECT ?type WHERE { <' + uri + '> a ?type }', graphUri)

    if (result && result[0]) {

        return result[0].type

    } else {

        throw new Error('getType: ' + uri + ' not found')

    }
}

module.exports = {
    getType: getType
}

