
let {getVersion} = require('../query/version');

let async = require('async');

let config = require('../config');

let pug = require('pug');

let getUrisFromReq = require('../getUrisFromReq');

let sbol = require('./sbol');

const {fetchSBOLSource} = require('../fetch/fetch-sbol-source');

const fs = require('mz/fs');

module.exports = function(req, res) {
const {graphUri, uri, designId, url} = getUrisFromReq(req, res);

getVersion(uri, graphUri).then((result) => {
let newUri = uri + '/' + result;
fetchSBOLSource(newUri, graphUri).then((tempFilename) => {
res.status(200).type('application/rdf+xml');
// .set({ 'Content-Disposition': 'attachment; filename=' + collection.name + '.xml' })

const readStream = fs.createReadStream(tempFilename);

readStream.pipe(res).on('finish', () => {
fs.unlink(tempFilename);
});
});
}).catch((err) => {
return res.status(404).send(uri + ' not found');
});
};


