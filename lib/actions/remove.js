let async = require('async');

let request = require('request');

let loadTemplate = require('../loadTemplate');

let config = require('../config');

let getUrisFromReq = require('../getUrisFromReq');

let sparql = require('../sparql/sparql');

const getOwnedBy = require('../query/ownedBy');

const pug = require('pug');

module.exports = function(req, res) {
req.setTimeout(0); // no timeout

const {graphUri, uri, designId, edit} = getUrisFromReq(req, res);

let uriPrefix = uri.substring(0, uri.lastIndexOf('/')+1);

let templateParams = {
uri: uri,
};

let removeQuery = loadTemplate('sparql/remove.sparql', templateParams);

return getOwnedBy(uri, graphUri).then((ownedBy) => {
if (!edit && (!req.user || !req.user.username ||
ownedBy.indexOf(config.get('databasePrefix') + 'user/' + req.user.username) === -1)) {
console.log('not authorized');
// res.status(401).send('not authorized to edit this submission')
if (!req.accepts('text/html')) {
res.status(500).type('text/plain').send('Not authorized to remove this submission');
return;
} else {
const locals = {
config: config.get(),
section: 'errors',
user: req.user,
errors: ['Not authorized to remove this submission'],
};
res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
}
}

sparql.deleteStaggered(removeQuery, graphUri).then(() => {
let templateParams = {
uri: uri,
};

removeQuery = loadTemplate('sparql/removeReferences.sparql', templateParams);

sparql.deleteStaggered(removeQuery, graphUri).then(() => {
res.redirect('/manage');
});
}).catch((err) => {
res.status(500).send(err.stack);
});
});
};


