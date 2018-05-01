

const SBOLDocument = require('sboljs')

const config = require('../../../config')

const { fetchSBOLObjectRecursive } = require('./fetch-sbol-object-recursive')

const fs = require('mz/fs')

const sparql = require('../../../sparql/sparql')

const tmp = require('tmp-promise')

const serializeSBOL = require('../../../serializeSBOL')

async function fetchSBOLSource(remoteConfig, type, objectUri) {

    let res = await fetchSBOLObjectRecursive(remoteConfig, new SBOLDocument(), type, objectUri)

    let tmpFilename = await tmp.tmpName()

    await fs.writeFile(tmpFilename, serializeSBOL(res.sbol))

    return tmpFilename
}

module.exports = {
    fetchSBOLSource: fetchSBOLSource
}

