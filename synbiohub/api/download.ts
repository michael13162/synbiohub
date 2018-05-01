import pug from 'pug';
import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import serializeSBOL from '../serializeSBOL';
import config from '../config';
import getUrisFromReq from '../getUrisFromReq';
import uploads from '../uploads';

export default async function(req, res) {

    const { graphUri, uri, designId, share } = getUrisFromReq(req, res)

    let result = await fetchSBOLObjectRecursive(uri, graphUri)

    const sbol = result.sbol
    const object = result.object

    var attachmentType = object.getAnnotation('http://wiki.synbiohub.org/wiki/Terms/synbiohub#attachmentType')
    var attachmentHash = object.getAnnotation('http://wiki.synbiohub.org/wiki/Terms/synbiohub#attachmentHash')

    if(sbol.attachments.length === 1) {
        attachmentType = sbol.attachments[0].format
        attachmentHash = sbol.attachments[0].hash
    }

    const readStream = uploads.createCompressedReadStream(attachmentHash)

    const mimeType = config.get('attachmentTypeToMimeType')[attachmentType] || 'application/octet-stream'

    res.status(200)
    res.header('Content-Encoding', 'gzip')
    res.header('Content-Disposition', 'attachment; filename="' + object.name + '"')
    res.type(mimeType)
    readStream.pipe(res)
};


