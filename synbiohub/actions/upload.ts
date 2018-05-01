
import pug from 'pug';
import loadTemplate from '../loadTemplate';
import getUrisFromReq from '../getUrisFromReq';
import config from '../config';
import getGraphUriFromTopLevelUri from '../getGraphUriFromTopLevelUri';
import multiparty from 'multiparty';
import uploads from '../uploads';
import attachments from '../attachments';
import streamToString from 'stream-to-string';
import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import SBOLDocument from 'sboljs';
import sparql from '../sparql/sparql-collate';
import getOwnedBy from '../query/ownedBy';

export default async function (req, res) {

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
};


