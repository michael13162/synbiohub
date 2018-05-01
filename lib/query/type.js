
const config = require('../config')

const local = require('./local/type')

const remote = {
    synbiohub: require('./remote/synbiohub/type'),
    ice: require('./remote/ice/type'),
    benchling: require('./remote/benchling/type')
}

const splitUri = require('../splitUri')

async function getType(uri, graphUri) {

    const { submissionId, version } = splitUri(uri)
    const remoteConfig = config.get('remotes')[submissionId]

    return remoteConfig !== undefined && version === 'current' ?
                await remote[remoteConfig.type].getType(remoteConfig, uri) :
                await local.getType(uri, graphUri)
}

module.exports = {
    getType: getType
}

