
var pug = require('pug')

const { fetchSBOLSource } = require('../fetch/fetch-sbol-source')

var serializeSBOL = require('../serializeSBOL')

var config = require('../config')

var getUrisFromReq = require('../getUrisFromReq')

const fs = require('mz/fs')

module.exports = async function(req, res) {

    req.setTimeout(0) // no timeout

    const { graphUri, uri, designId, share } = getUrisFromReq(req, res)
	
    let tempFilename = await fetchSBOLSource(uri, graphUri)

    res.status(200).type('application/rdf+xml')
        //.set({ 'Content-Disposition': 'attachment; filename=' + collection.name + '.xml' })

    const readStream = fs.createReadStream(tempFilename)
        
    readStream.pipe(res).on('finish', () => {
        fs.unlink(tempFilename)
    })
};


