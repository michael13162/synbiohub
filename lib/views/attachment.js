
const {fetchSBOLObjectRecursive} = require('../fetch/fetch-sbol-object-recursive');
const {getContainingCollections} = require('../query/collection');

let filterAnnotations = require('../filterAnnotations');
let retrieveCitations = require('../citations');

const shareImages = require('../shareImages');

let sbolmeta = require('sbolmeta');

let async = require('async');

let pug = require('pug');

let sparql = require('../sparql/sparql-collate');

let wiky = require('../wiky/wiky.js');

let config = require('../config');

let URI = require('sboljs').URI;

let getUrisFromReq = require('../getUrisFromReq');

const uriToUrl = require('../uriToUrl');

let sha1 = require('sha1');

module.exports = function(req, res) {
let locals = {
config: config.get(),
section: 'attachment',
user: req.user,
};

let meta;
let attachment;
let collectionIcon;
let remote;

let collections = [];

let submissionCitations = [];

const {graphUri, uri, designId, share, url} = getUrisFromReq(req, res);

let getCitationsQuery =
'PREFIX sbol2: <http://sbols.org/v2#>\n' +
'PREFIX purl: <http://purl.obolibrary.org/obo/>\n' +
'SELECT\n' +
'    ?citation\n'+
'WHERE {\n' +
'    <' + uri + '> purl:OBI_0001617 ?citation\n' +
'}\n';

fetchSBOLObjectRecursive(uri, graphUri).then((result) => {
attachment = result.object;
remote = result.remote;

if (!attachment || attachment instanceof URI) {
locals = {
config: config.get(),
section: 'errors',
user: req.user,
errors: [uri + ' Record Not Found'],
};
res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
return;
}
meta = sbolmeta.summarizeGenericTopLevel(attachment);
if (!meta) {
locals = {
config: config.get(),
section: 'errors',
user: req.user,
errors: [uri + ' summarizeGenericTopLevel returned null'],
};
res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
return;
}
}).then(function lookupCollections() {
return Promise.all([
getContainingCollections(uri, graphUri, req.url).then((_collections) => {
collections = _collections;

collections.forEach((collection) => {
collection.url = uriToUrl(collection.uri);

const collectionIcons = config.get('collectionIcons');

if (collectionIcons[collection.uri]) {
collectionIcon = collectionIcons[collection.uri];
}
});
}),

sparql.queryJson(getCitationsQuery, graphUri).then((results) => {
citations = results;
}).then(() => {
return retrieveCitations(citations).then((resolvedCitations) => {
submissionCitations = resolvedCitations;

// console.log('got citations ' + JSON.stringify(submissionCitations));
});
}),

]);
}).then(function renderView() {
if (meta.description != '') {
meta.description = wiky.process(meta.description, {});
}

meta.remote = remote;

meta.mutableDescriptionSource = meta.mutableDescription.toString() || '';
if (meta.mutableDescription.toString() != '') {
meta.mutableDescription = shareImages(req, meta.mutableDescription.toString());
meta.mutableDescription = wiky.process(meta.mutableDescription.toString(), {});
}

meta.mutableNotesSource = meta.mutableNotes.toString() || '';
if (meta.mutableNotes.toString() != '') {
meta.mutableNotes = shareImages(req, meta.mutableNotes.toString());
meta.mutableNotes = wiky.process(meta.mutableNotes.toString(), {});
}

meta.sourceSource = meta.source.toString() || '';
if (meta.source.toString() != '') {
meta.source = shareImages(req, meta.source.toString());
meta.source = wiky.process(meta.source.toString(), {});
}

locals.canEdit = false;

if (!remote && req.user) {
const ownedBy = attachment.getAnnotations('http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy');
const userUri = config.get('databasePrefix') + 'user/' + req.user.username;

if (ownedBy && ownedBy.indexOf(userUri) > -1) {
locals.canEdit = true;
}
}

meta.url = '/' + meta.uri.toString().replace(config.get('databasePrefix'), '');
if (req.url.toString().endsWith('/share')) {
meta.url += '/' + sha1('synbiohub_' + sha1(meta.uri) + config.get('shareLinkSalt')) + '/share';
}

if (attachment.wasGeneratedBy) {
meta.wasGeneratedBy = {uri: attachment.wasGeneratedBy.uri?attachment.wasGeneratedBy.uri:attachment.wasGeneratedBy,
url: uriToUrl(attachment.wasGeneratedBy, req),
};
}

locals.meta = meta;

locals.rdfType = {
name: 'Attachment',
url: 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Attachment',
};

locals.share = share;
locals.sbolUrl = url + '/' + meta.id + '.xml';
if (req.params.userId) {
locals.searchUsesUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/uses';
locals.searchTwinsUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/twins';
} else {
locals.searchUsesUrl = '/public/' + designId + '/uses';
locals.searchTwinsUrl = '/public/' + designId + '/twins';
}

locals.keywords = [];
locals.citations = [];
locals.prefix = req.params.prefix;

locals.collections = collections;

locals.collectionIcon = collectionIcon;

locals.submissionCitations = submissionCitations;

locals.meta.description = locals.meta.description.split(';').join('<br/>');

locals.attachmentType = attachment.getAnnotation('http://wiki.synbiohub.org/wiki/Terms/synbiohub#attachmentType');
locals.attachmentDownloadURL = url + '/download';

locals.annotations = filterAnnotations(req, attachment.annotations);

res.send(pug.renderFile('templates/views/attachment.jade', locals));
}).catch((err) => {
locals = {
config: config.get(),
section: 'errors',
user: req.user,
errors: [err.stack],
};
res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
});
};

function listNamespaces(xmlAttribs) {
let namespaces = [];

Object.keys(xmlAttribs).forEach(function(attrib) {
let tokens = attrib.split(':');

if (tokens[0] === 'xmlns') {
namespaces.push({
prefix: tokens[1],
uri: xmlAttribs[attrib],
});
}
});

return namespaces;
}


