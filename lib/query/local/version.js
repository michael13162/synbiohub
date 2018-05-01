
const loadTemplate = require('../../loadTemplate')
const sparql = require('../../sparql/sparql')
const compareMavenVersions = require('../../compareMavenVersions')

async function getVersion(uri, graphUri) {

    var query = loadTemplate('./sparql/GetVersions.sparql', {
        uri: uri
    })

    let results = await sparql.queryJson(query, graphUri)

    if(results && results[0]) {

        const sortedVersions = results.sort((a, b) => {

            return compareMavenVersions(a.version, b.version)

        }).reverse()

        return sortedVersions[0].version

    } else {

        throw new Error('not found')

    }
}

module.exports = {
    getVersion: getVersion
}

