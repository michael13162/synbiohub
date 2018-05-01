
const getUrisFromReq = require('../getUrisFromReq')
const splitUri = require('../splitUri')

const { fetchSBOLSource } = require('../fetch/fetch-sbol-source')

const prepareSnapshot = require('../conversion/prepare-snapshot')

const fs = require('mz/fs')

const sparql = require('../sparql/sparql')

module.exports = async function(req, res) {

    const { uri, graphUri, baseUri } = getUrisFromReq(req, res)
    const { displayId } = splitUri(uri)

    let tempFilename = await fetchSBOLSource(uri, graphUri)

    let result = await prepareSnapshot(tempFilename, {
        version: new Date().getTime() + '_snapshot',
        uriPrefix: baseUri
    })

    const { resultFilename } = result

    await sparql.uploadFile(null, resultFilename, 'application/rdf+xml')

    res.redirect('/admin/remotes')
}



