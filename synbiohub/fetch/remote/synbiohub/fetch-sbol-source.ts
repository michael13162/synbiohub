
import { fetchSBOLObjectRecursive } from './fetch-sbol-object-recursive';
import SBOLDocument from 'sboljs';
import tmp from 'tmp-promise';
import fs from 'mz/fs';
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


