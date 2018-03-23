
let extend = require('xtend');

function sparqlResultsToArray(results) {
// console.log('srta')
// console.log(JSON.stringify(results))

let resultTemplate = {};

results.head.vars.forEach((varName) => resultTemplate[varName] = null);

let ret = results.results.bindings.map((binding) => {
let result = extend({}, resultTemplate);

Object.keys(result).forEach((varName) => {
if (binding[varName]) {
result[varName] = flattenBinding(binding[varName]);
}
});

return result;
});

// console.log(JSON.stringify(ret))

return ret;

function flattenBinding(binding) {
if (binding.type === 'uri') {
return binding.value;
}

if (binding.type !== 'literal'
&& binding.type !== 'typed-literal') {
return binding;
}

switch (binding.datatype) {
case 'http://www.w3.org/2001/XMLSchema#boolean':
return binding.value === 'true' ? true : false;

case 'http://www.w3.org/2001/XMLSchema#integer':
return parseInt(binding.value);

default:
return binding.value;
}
}
}

module.exports = sparqlResultsToArray;


