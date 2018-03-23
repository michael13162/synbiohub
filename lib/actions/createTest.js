
let async = require('async');

let request = require('request');

let loadTemplate = require('../loadTemplate');

let config = require('../config');

let getUrisFromReq = require('../getUrisFromReq');
let splitUri = require('../splitUri');

let sparql = require('../sparql/sparql');

module.exports = function(req, res) {
req.setTimeout(0); // no timeout

const {graphUri, uri, designId, baseUri} = getUrisFromReq(req, res);

let implementationId = req.params.displayId.replace('_implementation', '_test');
let implementationVersion = '1';
let implementationPersistentIdentity = baseUri + '/' + implementationId;
let implementationUri = implementationPersistentIdentity + '/' + implementationVersion;

const userUri = config.get('databasePrefix') + 'user/' + req.user.username;

let templateParams = {
uri: sparql.escapeIRI(implementationUri),
persistentIdentity: sparql.escapeIRI(implementationPersistentIdentity),
displayId: JSON.stringify(implementationId),
version: JSON.stringify(implementationVersion),
testFor: sparql.escapeIRI(uri),
ownedBy: userUri,
};


let query = loadTemplate('sparql/CreateTest.sparql', templateParams);

sparql.updateQuery(query, graphUri).then((r) => {
console.log(r);
res.redirect('/'+implementationUri.replace(config.get('databasePrefix'), ''));
}).catch((err) => {
res.status(500).send(err.stack);
});
};

