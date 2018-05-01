var pug = require('pug')

const { fetchSBOLObjectRecursive } = require('../fetch/fetch-sbol-object-recursive')

var sbolmeta = require('sbolmeta')

var serializeSBOL = require('../serializeSBOL')

var request = require('request');

var SBOLDocument = require('sboljs')

var config = require('../config')

var getUrisFromReq = require('../getUrisFromReq')

const convertToGenBank = require('../conversion/convert-to-genbank')

const tmp = require('tmp-promise')

var fs = require('mz/fs');

module.exports = function(req, res) {

    const { graphUri, uri, designId, share } = getUrisFromReq(req, res)

    var sbol
    var componentDefinition

	async function saveTempFile() {

        let tmpFilename = await tmp.tmpName()

        await fs.writeFile(tmpFilename, serializeSBOL(sbol))

        return tmpFilename
    }

    let result = await fetchSBOLObjectRecursive(uri, graphUri)

    sbol = result.sbol
    componentDefinition = result.object

    console.log('-- converting to genbank');

    let tmpFilename = await saveTempFile()
        
    result = await convertToGenBank(tmpFilename, {

    })

    const { success, log, errorLog, resultFilename } = result

    if (!success) {

        const locals = {
            config: config.get(),
            section: 'invalid',
            user: req.user,
            errors: [errorLog]
        }

        await fs.unlink(tmpFilename)

        res.send(pug.renderFile('templates/views/errors/invalid.jade', locals))
        return

    } else {
        await fs.unlink(tmpFilename)

        res.header('content-type', 'text/plain').send(log);
        //res.header('content-type', 'text/plain').send(log);
    }
}
