
const pug = require('pug')

const loadTemplate = require('../loadTemplate')

const getUrisFromReq = require('../getUrisFromReq')

const config = require('../config')

const getGraphUriFromTopLevelUri = require('../getGraphUriFromTopLevelUri')

const multiparty = require('multiparty')

const uploads = require('../uploads')

const attachments = require('../attachments')

const streamToString = require('stream-to-string')

const { fetchSBOLObjectRecursive } = require('../fetch/fetch-sbol-object-recursive')

const SBOLDocument = require('sboljs')

var sparql = require('../sparql/sparql-collate')

const getOwnedBy = require('../query/ownedBy')

module.exports = async function (req, res) {

	var attachmentObjects = []

	const form = new multiparty.Form()

	const { graphUri, uri, designId, share, url, baseUri } = getUrisFromReq(req, res)

	let ownedBy = await getOwnedBy(uri, graphUri)

	if (ownedBy.indexOf(config.get('databasePrefix') + 'user/' + req.user.username) === -1) {
		return res.status(401).send('not authorized to edit this submission')
	}

	var done = false

	form.on('part', async (partStream) => {

		if (!partStream.filename)
			return

		if(done)
			return

		done = true

		let uploadInfo = await uploads.createUpload(partStream)
		console.log(JSON.stringify(uploadInfo))
		const { hash, size, mime } = uploadInfo
		console.log("Created upload!")
		console.log(JSON.stringify(uploadInfo))

		await attachments.addAttachmentToTopLevel(
			graphUri, baseUri, uri, partStream.filename, hash, size,
			mime, req.user.username)

			var templateParams = {
				uri: uri
			}

		var getAttachmentsQuery = loadTemplate('sparql/GetAttachments.sparql', templateParams)

		await Promise.all([
			sparql.queryJson(getAttachmentsQuery, graphUri).then((results) => {

				attachmentList = results

				return attachments.getAttachmentsFromList(graphUri, attachmentList).then((results) => {

					attachmentObjects = results

				})
			})
		])

		const locals = {
			config: config.get(),
			canEdit: true,
			url: url,
			attachments: attachmentObjects
		}

		res.send(pug.renderFile('templates/partials/attachments.jade', locals))
	})

	form.on('error', (err) => {
		throw err
	})

	form.parse(req)
}


