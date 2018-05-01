
const request = require('request-promise')
const config = require('../../../config')

const { collateArrays } = require('../../collate')

async function getCollectionMemberCount(remoteConfig, uri) {

    let body = await request({
        method: 'get',
        url: remoteConfig.url + '/' + uri.slice(config.get('databasePrefix').length) + '/memberCount'
    })

    return JSON.parse(body)
}


async function getRootCollectionMetadata(remoteConfig) {

    return []

}

async function getContainingCollections(remoteConfig, uri) {

    return []
}


function getCollectionMembers(remoteConfig, uri, limit, offset) {

    let body = await request({
        method: 'get',
        url: remoteConfig.url + '/' + uri.slice(config.get('databasePrefix').length) + '/members'
    })

    const members = JSON.parse(body)

    for(let member of members) {
        member.uri = member.uri.slice(remoteConfig.url.length)
    }

    return members
}

async function getCollectionMetaData(remoteConfig, uri) {

    let body = await request({
        method: 'get',
        url: remoteConfig.url + '/' + uri.slice(config.get('databasePrefix').length) + '/metadata'
    })

    return JSON.parse(body)
}

module.exports = {
    getCollectionMemberCount: getCollectionMemberCount,
    getRootCollectionMetadata: getRootCollectionMetadata,
    getContainingCollections: getContainingCollections,
    getCollectionMembers: getCollectionMembers,
    getCollectionMetaData: getCollectionMetaData
}


