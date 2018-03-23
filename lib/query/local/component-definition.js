
const sparql = require('../../sparql/sparql');
const loadTemplate = require('../../loadTemplate');
const config = require('../../config');

function getComponentDefinitionMetadata(uri, graphUri) {
  let templateParams = {
    componentDefinition: uri,
  };

  let query = loadTemplate('sparql/getComponentDefinitionMetaData.sparql', templateParams);

  graphUri = graphUri || config.get('triplestore').defaultGraph;

  return sparql.queryJson(query, graphUri).then((result) => {
    if (result && result[0]) {
      return Promise.resolve({
        metaData: result[0],
        graphUri: graphUri,
      });
    } else {
      return Promise.resolve(null);
    }
  });
}

module.exports = {
  getComponentDefinitionMetadata: getComponentDefinitionMetadata,
};


