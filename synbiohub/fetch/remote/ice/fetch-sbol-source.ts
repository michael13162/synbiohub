

import SBOLDocument from 'sboljs';
import config from '../../../config';
import { fetchSBOLObjectRecursive } from './fetch-sbol-object-recursive';
import fs from 'mz/fs';
import sparql from '../../../sparql/sparql';
import tmp from 'tmp-promise';
import serializeSBOL from '../../../serializeSBOL';

async function fetchSBOLSource(remoteConfig, type, objectUri) {

    let res = await fetchSBOLObjectRecursive(remoteConfig, new SBOLDocument(), type, objectUri)

    let tmpFilename = await tmp.tmpName()

    await fs.writeFile(tmpFilename, serializeSBOL(res.sbol))

    return tmpFilename
}

export default {
    fetchSBOLSource: fetchSBOLSource
};

