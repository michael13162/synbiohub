const loadTemplate = require('../loadTemplate');
const config = require('../config');
const local = require('./local/collection');
const splitUri = require('../splitUri');
const { collateArrays } = require('./collate');
const remote = {
    synbiohub: require('./remote/synbiohub/collection'),
    ice: require('./remote/ice/collection'),
    benchling: require('./remote/benchling/collection')
};

const uriToUrl = require('../uriToUrl')

async function getCollectionMemberCount(uri, graphUri, search) {

    const {
        submissionId,
        version
    } = splitUri(uri);

    const remoteConfig = config.get('remotes')[submissionId];

    if(remoteConfig !== undefined && version == 'current') {
        return await remote[remoteConfig.type].getCollectionMemberCount(remoteConfig, uri);
    } else {
        return await local.getCollectionMemberCount(uri, graphUri, search);
    }
}

function objValues(obj) {
    return Object.keys(obj).map((key) => obj[key]);
}

async function getRootCollectionMetadata(graphUri, user) {

    let arrs = await Promise.all(
        [local.getRootCollectionMetadata(graphUri)].concat(
            objValues(config.get('remotes')).map((remoteConfig) => {
                if (graphUri===null && (remoteConfig.public || (user && user.isMember))) {
                    return remote[remoteConfig.type].getRootCollectionMetadata(remoteConfig)
                } else {
                    return []
                }
            })
        )
    )

    return collateArrays(arrs)
}

async function getContainingCollections(uri, graphUri) {

    const { submissionId, version } = splitUri(uri);
    const remoteConfig = config.get('remotes')[submissionId];

    var collections

    if(remoteConfig !== undefined && version === 'current') {
        collections = await remote[remoteConfig.type].getContainingCollections(remoteConfig, uri);
    } else {
        collections = await local.getContainingCollections(uri, graphUri);
    }

    for(let collection of collections) {

        let collectionIcons = config.get('collectionIcons')

        collection.url = uriToUrl(collection.uri)

        if (collectionIcons[collection.uri])
            collection.icon = collectionIcons[collection.uri]
    }
    
    return collections
}

async function getCollectionMembers(uri, graphUri, limit, offset, sort, filter) {

    const { submissionId, version } = splitUri(uri);
    const remoteConfig = config.get('remotes')[submissionId];

    if (remoteConfig !== undefined && version === 'current') {
        return await remote[remoteConfig.type].getCollectionMembers(remoteConfig, uri, limit, offset);
    } else {
        return await local.getCollectionMembers(uri, graphUri, limit, offset, sort, filter);
    }
}

async function getSubCollections(uri, graphUri) {

    const { submissionId, version } = splitUri(uri);
    const remoteConfig = config.get('remotes')[submissionId];

    if (remoteConfig !== undefined && version === 'current') {
        return await remote[remoteConfig.type].getSubCollections(remoteConfig, uri);
    } else {
        return await local.getSubCollections(uri, graphUri);
    }
}


async function getCollectionMetaData(uri, graphUri) {

    const { submissionId, version } = splitUri(uri);
    const remoteConfig = config.get('remotes')[submissionId];

    if (remoteConfig !== undefined && version === 'current') {
        return await remote[remoteConfig.type].getCollectionMetaData(remoteConfig, uri);
    } else {
        return await local.getCollectionMetaData(uri, graphUri);
    }
}

async function getCollectionMembersRecursive(uri, graphUri) {

    let members = await getCollectionMembers(uri, graphUri)

    const subCollections = members.filter(member => {
        return member.type === 'http://sbols.org/v2#Collection';
    });

    await Promise.all(subCollections.map(subCollection => {

        let scMembers = await getCollectionMembersRecursive(subCollection.uri, graphUri)
        
        subCollection.members = scMembers

    }))

    return members
}

module.exports = {
    getRootCollectionMetadata: getRootCollectionMetadata,
    getCollectionMetaData: getCollectionMetaData,
    getCollectionMemberCount: getCollectionMemberCount,
    getContainingCollections: getContainingCollections,
    getCollectionMembers: getCollectionMembers,
    getCollectionMembersRecursive: getCollectionMembersRecursive,
    getSubCollections: getSubCollections
}