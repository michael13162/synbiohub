
import config from '../config';
import local from './local/type';
import synbiohub from './remote/synbiohub/type';
import ice from './remote/ice/type';
import benchling from './remote/benchling/type';

const remote = {
    synbiohub,
    ice,
    benchling
}

import splitUri from '../splitUri';

async function getType(uri, graphUri) {

    const { submissionId, version } = splitUri(uri)
    const remoteConfig = config.get('remotes')[submissionId]

    return remoteConfig !== undefined && version === 'current' ?
                await remote[remoteConfig.type].getType(remoteConfig, uri) :
                await local.getType(uri, graphUri)
}

export default {
    getType: getType
};

