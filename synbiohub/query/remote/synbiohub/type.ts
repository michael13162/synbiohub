
import request from 'request';
import config from '../../../config';

async function getType(remoteConfig, uri) {

    let body = await request({
        method: 'get',
        url: remoteConfig.url + '/' + uri.slice(config.get('databasePrefix').length) + '/metadata'
    })

    return JSON.parse(body).type
}

export default {
    getType: getType
};

