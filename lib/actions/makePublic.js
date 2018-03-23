const {
getCollectionMetaData,
} = require('../query/collection');

let pug = require('pug');

let async = require('async');

let request = require('request');

const {
fetchSBOLObjectRecursive,
} = require('../fetch/fetch-sbol-object-recursive');

const serializeSBOL = require('../serializeSBOL');

let config = require('../config');

let loadTemplate = require('../loadTemplate');

let extend = require('xtend');

let getUrisFromReq = require('../getUrisFromReq');

let sparql = require('../sparql/sparql');

const tmp = require('tmp-promise');

let fs = require('mz/fs');

const prepareSubmission = require('../prepare-submission');

module.exports = function(req, res) {
req.setTimeout(0); // no timeout

function addToCollectionsForm(req, res, collectionId, version, locals) {
let collectionQuery = 'PREFIX dcterms: <http://purl.org/dc/terms/> PREFIX sbol2: <http://sbols.org/v2#> SELECT ?object ?name WHERE { ?object a sbol2:Collection . FILTER NOT EXISTS { ?otherCollection sbol2:member ?object } OPTIONAL { ?object dcterms:title ?name . }}';
let collections;

function sortByNames(a, b) {
if (a.name < b.name) {
return -1;
} else {
return 1;
}
}

return sparql.queryJson(collectionQuery, null).then((collections) => {
collections.forEach((result) => {
result.uri = result.object;
result.name = result.name ? result.name : result.uri.toString();
delete result.object;
});
collections.sort(sortByNames);

locals = extend({
config: config.get(),
section: 'makePublic',
user: req.user,
collections: collections,
submission: {
id: collectionId || '',
version: version || '',
name: '',
description: '',
citations: '',
},
errors: {},
}, locals);
res.send(pug.renderFile('templates/views/makePublic.jade', locals));
return;
});
}

let overwrite_merge = '0';
let collectionId = req.params.collectionId;
let version = req.params.version;
let name = '';
let description = '';
let citations = [];

const {
graphUri,
uri,
designId,
} = getUrisFromReq(req, res);

if (req.method === 'POST') {
overwrite_merge = req.body.tabState === 'new' ? '0' : '2';
collectionId = req.body.id;
version = req.body.version;
collectionUri = req.body.collections;
name = req.body.name;
description = req.body.description;
citations = req.body.citations;
if (citations) {
citations = citations.split(',').map(function(pubmedID) {
return pubmedID.trim();
}).filter(function(pubmedID) {
return pubmedID !== '';
});
} else {
citations = [];
}

let errors = [];
if (overwrite_merge === '0') {
if (collectionId === '') {
errors.push('Please enter an id for your submission');
}

if (version === '') {
errors.push('Please enter a version for your submission');
}

collectionUri = config.get('databasePrefix') + 'public/' + collectionId + '/' + collectionId + '_collection/' + version;
} else {
if (!collectionUri || collectionUri === '') {
errors.push('Please select a collection to add to');
}

let tempStr = collectionUri.replace(config.get('databasePrefix') + 'public/', '');
collectionId = tempStr.substring(0, tempStr.indexOf('/'));
version = tempStr.replace(collectionId + '/' + collectionId + '_collection/', '');
}

if (errors.length > 0) {
return addToCollectionsForm(req, res, collectionId, version, {
errors: errors,
});
}
} else {
return addToCollectionsForm(req, res, collectionId, version, {});
}

console.log('getting collection');

let sbol;
let collection;

console.log('uri:' + uri);
console.log('graphUri:' + graphUri);

fetchSBOLObjectRecursive(uri, graphUri).then((result) => {
sbol = result.sbol;
collection = result.object;

if (version === 'current') version = '1';

let uri = collectionUri;

console.log('check if exists:' + uri);

return getCollectionMetaData(collectionUri, null /* public store */ ).then((result) => {
if (!result) {
/* not found */
console.log('not found');
if (overwrite_merge === '0') {
return makePublic();
} else {
// NOTE: this should never happen, since chosen from a list of existing collections
return addToCollectionsForm(req, res, collectionId, version, {
errors: ['Submission id ' + collectionId + ' version ' + version + ' not found'],
});
}
}

const metaData = result;

if (overwrite_merge === '0') {
// Prevent make public
console.log('prevent');
let locals = {};
locals = extend({
config: config.get(),
section: 'makePublic',
user: req.user,
submission: {
id: collectionId || '',
version: version || '',
},
errors: ['Submission id ' + collectionId + ' version ' + version + ' already in use'],
}, locals);
res.send(pug.renderFile('templates/views/makePublic.jade', locals));
} else {
// Merge
console.log('merge');
collectionId = metaData.displayId.replace('_collection', '');
version = metaData.version;

return makePublic();
}
});
}).catch((err) => {
const locals = {
config: config.get(),
section: 'errors',
user: req.user,
errors: [err.stack],
};

res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
});


function saveTempFile() {
return tmp.tmpName().then((tmpFilename) => {
return fs.writeFile(tmpFilename, serializeSBOL(sbol)).then(() => {
return Promise.resolve(tmpFilename);
});
});
}

function makePublic() {
console.log('-- validating/converting');

return saveTempFile().then((tmpFilename) => {
console.log('tmpFilename is ' + tmpFilename);

return prepareSubmission(tmpFilename, {

uriPrefix: config.get('databasePrefix') + 'public/' + collectionId + '/',

name: name || '',
description: description || '',
version: version,

keywords: [],

rootCollectionIdentity: config.get('databasePrefix') + 'public/' + collectionId + '/' + collectionId + '_collection' + '/' + version,
newRootCollectionDisplayId: collectionId + '_collection',
newRootCollectionVersion: version,
ownedByURI: config.get('databasePrefix') + 'user/' + req.user.username,
creatorName: '',
citationPubmedIDs: citations,
overwrite_merge: overwrite_merge,

});
}).then((result) => {
const {
success,
log,
errorLog,
resultFilename,
} = result;

if (!success) {
const locals = {
config: config.get(),
section: 'invalid',
user: req.user,
errors: [errorLog],
};

res.send(pug.renderFile('templates/views/errors/invalid.jade', locals));

return;
}

console.log('upload');

return sparql.uploadFile(null, resultFilename, 'application/rdf+xml').then(function removeSubmission(next) {
if (req.params.version != 'current') {
console.log('remove');

let designId = req.params.collectionId + '/' + req.params.displayId + '/' + version;
let uri = config.get('databasePrefix') + 'user/' + encodeURIComponent(req.params.userId) + '/' + designId;

let uriPrefix = uri.substring(0, uri.lastIndexOf('/'));
if (uriPrefix.endsWith('_collection')) {
uriPrefix = uriPrefix.substring(0, uriPrefix.lastIndexOf('/') + 1);
}

let templateParams = {
collection: uri,
uriPrefix: uriPrefix,
version: version,
};

let removeQuery = loadTemplate('sparql/removeCollection.sparql', templateParams);
console.log(removeQuery);

return sparql.deleteStaggered(removeQuery, graphUri).then(() => {
templateParams = {
uri: uri,
};
removeQuery = loadTemplate('sparql/remove.sparql', templateParams);
sparql.deleteStaggered(removeQuery, graphUri).then(() => {
console.log('update collection membership');
let d = new Date();
let modified = d.toISOString();
modified = modified.substring(0, modified.indexOf('.'));
const updateQuery = loadTemplate('./sparql/UpdateCollectionMembership.sparql', {
modified: JSON.stringify(modified),
});
sparql.updateQuery(updateQuery, null).then((result) => {
res.redirect('/manage');
});
});
});
} else {
return res.redirect('/manage');
}
});
});
}
};
