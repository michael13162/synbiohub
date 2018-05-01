
import saveN3ToRdfXml from './save-n3-to-rdfxml';
import java from '../java';
import fs from 'mz/fs';
import config from '../config';


/* Takes an array of strings containing n3 triples
 * Returns the filename of a temporary XML file containing well-formatted SBOL.
 */
async function n3ToSBOL(n3) {

    let tempRdfFilename = await saveN3ToRdfXml(n3)

    let res = await java('rdfToSBOL', {

        sbolFilename: tempRdfFilename,
        uriPrefix: '',
        requireComplete: config.get('requireComplete'),
        requireCompliant: config.get('requireCompliant'),
        enforceBestPractices: config.get('requireBestPractice'),
        typesInURI: false,
        version: '',
        keepGoing: true,
    webOfRegistries: config.get('webOfRegistries')
    })


    const { success, log, errorLog, resultFilename } = res

    if(!success) {
        throw new Error(errorLog)
    }

    console.log('tsf is ')
    console.log(resultFilename)

    await fs.unlink(tempRdfFilename)

    return resultFilename
}

export default n3ToSBOL;

