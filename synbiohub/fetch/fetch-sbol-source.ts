
import config from '../config';
import splitUri from '../splitUri';
import synbiohub from './remote/synbiohub/fetch-sbol-source';
import ice from './remote/ice/fetch-sbol-source';
import benchling from './remote/benchling/fetch-sbol-source';

const remote = {
    synbiohub,
    ice,
    benchling
}

import local from './local/fetch-sbol-source';

function fetchSBOLSource(type, uri, graphUri) {

    const args = [].slice.call(arguments, 0)

    /* fetchSBOLSource(uri, graphUri)
     */
    if(args.length === 2) {

        type = null
        uri = args[0]
        graphUri = args[1]

    }

    const { submissionId, version } = splitUri(uri)
    const remoteConfig = config.get('remotes')[submissionId]

    return remoteConfig !== undefined && version === 'current' ?
                remote[remoteConfig.type].fetchSBOLSource(remoteConfig, type, uri) :
                local.fetchSBOLSource(type, uri, graphUri)

}

export default {
    fetchSBOLSource: fetchSBOLSource
};

