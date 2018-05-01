
const sparql = require('../../sparql/sparql')
const async = require('async')
const loadTemplate = require('../../loadTemplate')
const config = require('../../config')

function getComponentDefinitionMetadata(uri, graphUri) {

    var templateParams = {
        componentDefinition: uri
    }

    var query = loadTemplate('sparql/getComponentDefinitionMetaData.sparql', templateParams)

    graphUri = graphUri || config.get('triplestore').defaultGraph

    let result = await sparql.queryJson(query, graphUri)

    if (result && result[0]) {

        return {
            metaData: result[0],
            graphUri: graphUri
        }

    } else {

        return null

    }

}

module.exports = {
    getComponentDefinitionMetadata: getComponentDefinitionMetadata
}


