
let sparql = require('./sparql');

function sbolToSparql(sbol) {
  let filter = [];

  if (sbol.componentDefinitions.length > 0) {
    let componentDefinition = sbol.componentDefinitions[0];

    componentDefinition.types.forEach(function(type) {
      filter.push('?ComponentDefinition sbol2:type ' + sparql.escapeIRI(type) + ' .');
    });

    componentDefinition.roles.forEach(function(role) {
      filter.push('?ComponentDefinition sbol2:role ' + sparql.escapeIRI(role) + ' .');
    });

    componentDefinition.annotations.forEach(function(annotation) {
      filter.push('?ComponentDefinition ' + sparql.escapeIRI(annotation.name) + ' ' + sparql.escapeIRI(annotation.value) + ' .');
    });

    let searchPrefix='http://www.openrdf.org/contrib/lucenesail#';

    if (componentDefinition.name !== '') {
      filter.push('?ComponentDefinition  <' + searchPrefix + 'matches> ?nameMatch .');
      filter.push('?nameMatch <' + searchPrefix + 'property> dcterms:title .');
      filter.push('?nameMatch  <' + searchPrefix + 'query> \'' + componentDefinition.name + '\' .');
    }
  }

  return filter.join('\n');
}

module.exports = sbolToSparql;
