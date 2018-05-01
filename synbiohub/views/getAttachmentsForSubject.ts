
import loadTemplate from '../loadTemplate';
import sparql from './sparql';

export default async function getAttachmentsForSubject(subject, graphUri) {

    var getAttachmentsQuery = loadTemplate('sparql/GetAttachments.sparql', templateParams)

    let attachmentList = await sparql.queryJson(getAttachmentsQuery, graphUri)

    return await getAttachmentsFromList.getAttachmentsFromList(graphUri, attachmentList, req.url.toString().endsWith('/share'))
}


