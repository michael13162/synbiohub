
import java from '../java';
import extend from 'xtend';
import config from '../config';

async function convertToGenBank(inFilename, opts) {

    opts = extend({

        sbolFilename: inFilename,
        requireComplete: config.get('requireComplete'),
        requireCompliant: config.get('requireCompliant'),
        enforceBestPractices: config.get('requireBestPractice'),
        typesInURI: false,
        keepGoing: false,
        topLevelURI: ''

    }, opts)

    let result = await java('convertToGenBank', opts)

    const { success, log, errorLog, resultFilename } = result

    return result
}

export default convertToGenBank;


