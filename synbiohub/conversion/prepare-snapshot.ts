
import java from '../java';
import extend from 'xtend';
import config from '../config';
import fs from 'mz/fs';

async function prepareSnapshot(inFilename, opts) {

    console.log('***** CVO ' + inFilename)
    
    fs.writeFileSync('broken.xml', fs.readFileSync(inFilename) + '')

    opts = extend({

        sbolFilename: inFilename,
        requireComplete: config.get('requireComplete'),
        requireCompliant: config.get('requireCompliant'),
        enforceBestPractices: config.get('requireBestPractice'),
        typesInURI: false,
        version: '1',
        keepGoing: false,
        topLevelURI: ''

    }, opts)

    let result = await java('prepareSnapshot', opts)

    const { success, log, errorLog, resultFilename } = result

    return result
}

export default prepareSnapshot;


