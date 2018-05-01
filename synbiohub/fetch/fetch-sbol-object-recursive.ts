
import SBOLDocument from 'sboljs';
import assert from 'assert';
import config from '../config';
import splitUri from '../splitUri';
import local from './local/fetch-sbol-object-recursive';
import synbiohub from './remote/synbiohub/fetch-sbol-object-recursive';
import ice from './remote/ice/fetch-sbol-object-recursive';
import benchling from './remote/benchling/fetch-sbol-object-recursive';

const remote = {
    synbiohub,
    ice,
    benchling
}

function fetchSBOLObjectRecursive(sbol, type, uri, graphUri) {

    const args = [].slice.call(arguments, 0)

    /* fetchSBOLObjectRecursive(uri, graphUri)
     */
    if(args.length === 2) {

        sbol = new SBOLDocument()
        type = null
        uri = args[0]
        graphUri = args[1]

    } else if(args.length === 3) {

        /* fetchSBOLObjectRecursive(type, uri, graphUri)
        */
        sbol = new SBOLDocument()
        type = args[0]
        uri = args[1]
        graphUri = args[2]
    }

    if(Array.isArray(uri)) {
        assert(uri.length === 1)
        uri = uri[0]
    }

    const { submissionId, version } = splitUri(uri)
    const remoteConfig = config.get('remotes')[submissionId]

    return remoteConfig !== undefined && version === 'current' ?
                remote[remoteConfig.type].fetchSBOLObjectRecursive(remoteConfig, sbol, type, uri) :
                local.fetchSBOLObjectRecursive(sbol, type, uri, graphUri)

}

export default {
    fetchSBOLObjectRecursive: fetchSBOLObjectRecursive
};

