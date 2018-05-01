

var getUrisFromReq = require('../getUrisFromReq')

const { getSubCollections } = require('../query/collection')

async function subCollections(req, res) {

    const { graphUri, uri, designId, share } = getUrisFromReq(req, res)

    let collections = await getSubCollections(uri, graphUri)

    res.header('content-type', 'application/json').send(JSON.stringify(collections))

}

module.exports = subCollections


