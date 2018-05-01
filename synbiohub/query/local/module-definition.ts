
async function getModuleDefinitionMetadata(uri, graphUris) {

    var templateParams = {
        moduleDefinition: uri
    }

    var query = loadTemplate('sparql/getModuleDefinitionMetaData.sparql', templateParams)

    for(let graphUri of graphUris) {

        graphUri = graphUri || config.get('triplestore').defaultGraph

        let result = await sparql.queryJson(query, graphUri)

        if (result && result[0]) {

            return {
                graphUri: graphUri,
                metaData: result[0]
            }

        }

    }

    return undefined
}


