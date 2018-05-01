
import request from 'request';
import config from '../../../config';
import benchling from '../../../benchling';
import splitUri from '../../../splitUri';

function getCollectionMemberCount(remoteConfig, uri) {

    const { displayId } = splitUri(uri)

    if(displayId === remoteConfig.rootCollection.displayId) {

        return benchling.getRootFolderCount(remoteConfig)

    }

    if(displayId.indexOf(remoteConfig.folderPrefix) !== 0) {

        res.status(404).send('???')
        return

    }

    const folderId = displayId.slice(remoteConfig.folderPrefix.length)

    return benchling.getFolderEntryCount(remoteConfig, folderId)
}

function getRootCollectionMetadata(remoteConfig) {

    return [
        {
            uri: config.get('databasePrefix') + 'public/' + remoteConfig.id +
                        '/' + remoteConfig.rootCollection.displayId
                            + '/current',
            version: 'current',
            name: remoteConfig.rootCollection.name,
            displayId: remoteConfig.rootCollection.displayId,
            description: remoteConfig.rootCollection.description,
            wasDerivedFrom: 'https://benchling.com', //remoteConfig.url + '/folders/',
            remote: true
        }
    ]

}

function getContainingCollections(remoteConfig, uri) {

    var rootUri = config.get('databasePrefix') + 'public/' + remoteConfig.id + '/' + remoteConfig.id + '_collection/current'
    
    if (uri != rootUri) {
        return [{
            uri: rootUri,
            name: remoteConfig.rootCollection.name
        }]
    } else {
        return []
    }

}


async function getCollectionMembers(remoteConfig, uri, limit, offset) {

    const { displayId } = splitUri(uri)

    if(displayId === remoteConfig.rootCollection.displayId) {

        let rootFolders = await benchling.getRootFolders(remoteConfig, offset, limit)

        return foldersToCollections(rootFolders)

    }

    const folderId = displayId.slice(remoteConfig.folderPrefix.length)

    let entries = await benchling.getFolderEntries(remoteConfig, folderId, offset, limit)
    let metadata = entriesToMetadata(entries)

    return concatArrays(metadata)


    function concatArrays(arrs) {

        const res = []

        arrs.forEach((arr) => {
            Array.prototype.push.apply(res, arr)
        })

        return res
    }

    function foldersToCollections(folders) {

        return folders.map((folder) => {
            return {
                type: 'http://sbols.org/v2#Collection',
                displayId: remoteConfig.folderPrefix + folder.id,
                version: 'current',
                uri: config.get('databasePrefix') + 'public/' + remoteConfig.id + '/' + remoteConfig.folderPrefix + folder.id + '/current',
                name: folder.name,
                description: folder.description,
                wasDerivedFrom: 'https://benchling.com', //remoteConfig.url + '/folders/' + folder.id,
                remote: true
            }
        })
    }

    function entriesToMetadata(entries) {

        const version = 'current'

        return entries.map((entry) => {

            const res = [
                {
                    type: 'http://sbols.org/v2#ComponentDefinition',
                    uri: config.get('databasePrefix') + 'public/' + remoteConfig.id + '/' + entry.id + '/' + version,
                    displayId: entry.id,
                    version: version,
                    name: entry.name,
                    description: '',
                    wasDerivedFrom: 'https://benchling.com', //remoteConfig.url + '/sequences/' + entry.id,
                    remote: true
                }
            ]

	    // TODO: should we include sequences in the collection list?
            // if(entry.hasSequence) {

            //     res.push({
            //         type: 'http://sbols.org/v2#Sequence',
            //         uri: config.get('databasePrefix') + 'public/' + remoteConfig.id + '/' + entry.partId + remoteConfig.sequenceSuffix + '/' + version,
            //         displayId: entry.partId + remoteConfig.sequenceSuffix,
            //         version: version,
            //         name: entry.name + ' sequence',
            //         description: '',
            //         wasDerivedFrom: remoteConfig.url + '/entry/' + entry.partId,
            //         remote: true
            //     })
            // }

            return res
        })

    }

}

async function getCollectionMetaData(remoteConfig, uri) {

    const { displayId } = splitUri(uri)

    if(displayId === remoteConfig.rootCollection.displayId) {

        let metadata = await getRootCollectionMetadata(remoteConfig)

        return metadata[0]

    }

    const folderId = displayId.slice(remoteConfig.folderPrefix.length)

    let folder = await benchling.getFolder(remoteConfig, folderId)

    return {
        type: 'http://sbols.org/v2#Collection',
        displayId: remoteConfig.folderPrefix + folder.id,
        version: 'current',
        uri: config.get('databasePrefix') + remoteConfig.id + '/' + remoteConfig.folderPrefix + folder.id + '/current',
        name: folder.name,
        description: folder.description,
        wasDerivedFrom: 'https://benchling.com', //remoteConfig.url + '/folders/' + folder.id,
        remote: true
    }

}

function getSubCollections(remoteConfig, uri) {

    const { displayId } = splitUri(uri)

    if(displayId === remoteConfig.rootCollection.displayId) {

        return getCollectionMembers(remoteConfig, uri)

    } else {

        return []

    }

}

export default {
    getCollectionMemberCount: getCollectionMemberCount,
    getRootCollectionMetadata: getRootCollectionMetadata,
    getContainingCollections: getContainingCollections,
    getCollectionMembers: getCollectionMembers,
    getCollectionMetaData: getCollectionMetaData,
    getSubCollections: getSubCollections
};


