
var loadTemplate = require('../loadTemplate')
var sparql = require('./sparql')

export default async function getAttachmentsForSubject(subject, graphUri) {

    var getAttachmentsQuery = loadTemplate('sparql/GetAttachments.sparql', templateParams)

    let attachmentList = await sparql.queryJson(getAttachmentsQuery, graphUri)

    return await getAttachmentsFromList.getAttachmentsFromList(graphUri, attachmentList, req.url.toString().endsWith('/share'))
}


