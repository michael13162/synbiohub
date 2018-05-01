
import pug from 'pug';
import { fetchSBOLSource } from '../fetch/fetch-sbol-source';
import serializeSBOL from '../serializeSBOL';
import config from '../config';
import getUrisFromReq from '../getUrisFromReq';
import fs from 'mz/fs';

export default async function(req, res) {

    req.setTimeout(0) // no timeout

    const { graphUri, uri, designId, share } = getUrisFromReq(req, res)
	
    let tempFilename = await fetchSBOLSource(uri, graphUri)

    res.status(200).type('application/rdf+xml')
        //.set({ 'Content-Disposition': 'attachment; filename=' + collection.name + '.xml' })

    const readStream = fs.createReadStream(tempFilename)
        
    readStream.pipe(res).on('finish', () => {
        fs.unlink(tempFilename)
    })
};


