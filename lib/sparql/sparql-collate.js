let sparql = require('./sparql');

function sparqlCollate(graphUris, query, callback) {
  return Promise.all(graphUris.map(
    (graphUri) => sparql.queryJson(query, graphUri)))
    .then(collateResults);

  function collateResults(results) {
    let collatedResults = [];

    results.forEach((resultSet) => {
      [].push.apply(collatedResults, resultSet);
    });

    return Promise.resolve(collatedResults);
  }
}

module.exports = sparqlCollate;


