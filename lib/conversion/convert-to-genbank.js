
const java = require('../java')
const extend = require('xtend')
const config = require('../config')

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

module.exports = convertToGenBank


