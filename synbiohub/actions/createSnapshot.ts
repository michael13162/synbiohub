
import getUrisFromReq from '../getUrisFromReq';
import splitUri from '../splitUri';
import { fetchSBOLSource } from '../fetch/fetch-sbol-source';
import prepareSnapshot from '../conversion/prepare-snapshot';
import fs from 'mz/fs';
import sparql from '../sparql/sparql';

export default async function(req, res) {

    const { uri, graphUri, baseUri } = getUrisFromReq(req, res)
    const { displayId } = splitUri(uri)

    let tempFilename = await fetchSBOLSource(uri, graphUri)

    let result = await prepareSnapshot(tempFilename, {
        version: new Date().getTime() + '_snapshot',
        uriPrefix: baseUri
    })

    const { resultFilename } = result

    await sparql.uploadFile(null, resultFilename, 'application/rdf+xml')

    res.redirect('/admin/remotes')
};



