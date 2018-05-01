
const request = require('request')
const config = require('../../../config')

async function getType(remoteConfig, uri) {

    let body = await request({
        method: 'get',
        url: remoteConfig.url + '/' + uri.slice(config.get('databasePrefix').length) + '/metadata'
    })

    return JSON.parse(body).type
}

module.exports = {
    getType: getType
}

