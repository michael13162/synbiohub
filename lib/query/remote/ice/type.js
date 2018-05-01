
const splitUri = require('../../../splitUri')

async function getType(remoteConfig, uri) {

    const { displayId } = splitUri(uri)

    if(displayId === remoteConfig.rootCollection.displayId) {

        return 'http://sbols.org/v2#Collection'

    } else if(displayId === 'available') {

        return 'http://sbols.org/v2#Collection'

    } else if(displayId.indexOf(remoteConfig.folderPrefix) === 0) {

        return 'http://sbols.org/v2#Collection'

    } else if(displayId.endsWith(remoteConfig.sequenceSuffix)) {

        return 'http://sbols.org/v2#Sequence'

    } else {

        return 'http://sbols.org/v2#ComponentDefinition'

    }

}

module.exports = {
    getType: getType
}


