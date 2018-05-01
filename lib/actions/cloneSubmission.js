
const { getCollectionMetaData } = require('../query/collection')
const { fetchSBOLObjectRecursive } = require('../fetch/fetch-sbol-object-recursive')

var loadTemplate = require('../loadTemplate')

var pug = require('pug')

var fs = require('mz/fs');

var async = require('async');

var SBOLDocument = require('sboljs')

var extend = require('xtend')

var serializeSBOL = require('../serializeSBOL')

var request = require('request')

var config = require('../config')

var getUrisFromReq = require('../getUrisFromReq')

const cloneSubmission = require('../clone-submission')

var sparql = require('../sparql/sparql')

const tmp = require('tmp-promise')

module.exports = function(req, res) {

    if(req.method === 'POST') {

        var submissionData = {
            id: req.body.id || '',
            version: req.body.version || '',
            overwrite_merge: req.body.overwrite_merge || ''
        }

        clonePost(req, res, submissionData)

    } else {

        var submissionData = {
            id: req.params.collectionId || '',
            version: req.params.version || ''
        }

        cloneForm(req, res, submissionData, {})

    }
}

function cloneForm(req, res, submissionData, locals) {

    req.setTimeout(0) // no timeout
	
    var submissionID = '';

	locals = extend({
        config: config.get(),
        section: 'submit',
        user: req.user,
        submission: submissionData,
        errors: []
    }, locals)

    res.send(pug.renderFile('templates/views/clone.jade', locals))
}
	

function clonePost(req, res, submissionData) {

    var submissionFile = '';

    var errors = []

    var overwrite_merge = req.body.overwrite_merge

    submissionData.id = submissionData.id.trim()
    submissionData.version = submissionData.version.trim()

    if(submissionData.id === '') {
        errors.push('Please enter an id for your submission')
    }

    if(submissionData.version === '') {
        errors.push('Please enter a version for your submission')
    }

    if (submissionData.id+'_collection' === req.params.displayId &&
	submissionData.version === req.params.version) {
        errors.push('Please enter a different id or version for your submission')
    }

    if(errors.length > 0) {
        return cloneForm(req, res, submissionData, {
            errors: errors
        })
    }

    var convertedSBOL
    var xml

    const { designId, uri, graphUri } = getUrisFromReq(req, res)

    let result = await fetchSBOLObjectRecursive(uri, req.user.graphUri)

    let sbol = result.sbol
    let collection = result.object

    var newUri = config.get('databasePrefix') + 'user/' + encodeURIComponent(req.user.username) + '/' + submissionData.id + '/' + submissionData.id + '_collection' + '/' + submissionData.version

    let metaData = await getCollectionMetaData(newUri, graphUri)

    if (!metaData) {
        return doClone()
    }

    if (overwrite_merge === '2' || overwrite_merge === '3') {

        // Merge
        console.log('merge')
        submissionData.name = metaData.name || ''
        submissionData.description = metaData.description || ''

        return doClone()

    } else if (overwrite_merge === '1') {

        // Overwrite
        console.log('overwrite')
        uriPrefix = uri.substring(0, uri.lastIndexOf('/'))
        uriPrefix = uriPrefix.substring(0, uriPrefix.lastIndexOf('/') + 1)

        var templateParams = {
            collection: uri,
            uriPrefix: uriPrefix,
            version: submissionData.version
        }
        console.log('removing ' + templateParams.uriPrefix)
        var removeQuery = loadTemplate('sparql/removeCollection.sparql', templateParams)
        return sparql.deleteStaggered(removeQuery, graphUri).then(() => {
            templateParams = {
                uri: uri
            }
            removeQuery = loadTemplate('sparql/remove.sparql', templateParams)
            sparql.deleteStaggered(removeQuery, graphUri).then(doClone)
        })

    } else {

        // Prevent make public
        console.log('prevent')

        if (req.forceNoHTML || !req.accepts('text/html')) {
            console.log('prevent')
            res.status(500).type('text/plain').send('Submission id and version already in use')
            return
        } else {
            errors.push('Submission id and version already in use')

            cloneForm(req, res, submissionData, {
                errors: errors
            })
        }
    }

    function saveTempFile() {

        let tmpFilename = await tmp.tmpName()

        await fs.writeFile(tmpFilename, serializeSBOL(sbol))

        return tmpFilename
    }

    function doClone() {

        console.log('-- validating/converting');

        let tmpFilename = await saveTempFile()

        console.log('tmpFilename is ' + tmpFilename)

        let result = await cloneSubmission(tmpFilename, {
            uriPrefix: config.get('databasePrefix') + 'user/' + encodeURIComponent(req.user.username) + '/' + submissionData.id + '/',

            version: submissionData.version,

            rootCollectionIdentity: config.get('databasePrefix') + 'user/' + encodeURIComponent(req.user.username) + '/' + submissionData.id + '/' + submissionData.id + '_collection/' + submissionData.version,
            originalCollectionDisplayId: req.params.displayId,
            originalCollectionVersion: req.params.version,
            newRootCollectionDisplayId: submissionData.id + '_collection',
            newRootCollectionVersion: submissionData.version,
            overwrite_merge: submissionData.overwrite_merge

        })

        const { success, log, errorLog, resultFilename } = result

        if (!success) {
            if (req.forceNoHTML || !req.accepts('text/html')) {
                res.status(500).type('text/plain').send(errorLog)
                return
            } else {
                const locals = {
                    config: config.get(),
                    section: 'invalid',
                    user: req.user,
                    errors: [errorLog]
                }

                res.send(pug.renderFile('templates/views/errors/invalid.jade', locals))
                return
            }
        }

        console.log('uploading sbol...');

        if (req.forceNoHTML || !req.accepts('text/html')) {

            await sparql.uploadFile(req.user.graphUri, resultFilename, 'application/rdf+xml')

            // TODO: add to collectionChoices
            res.status(200).type('text/plain').send('Successfully uploaded')

        } else {

            await sparql.uploadFile(req.user.graphUri, resultFilename, 'application/rdf+xml')

            res.redirect('/manage')
        }
    }
}
