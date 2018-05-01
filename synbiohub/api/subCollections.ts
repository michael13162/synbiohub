

import getUrisFromReq from '../getUrisFromReq';
import { getSubCollections } from '../query/collection';

async function subCollections(req, res) {

    const { graphUri, uri, designId, share } = getUrisFromReq(req, res)

    let collections = await getSubCollections(uri, graphUri)

    res.header('content-type', 'application/json').send(JSON.stringify(collections))

}

export default subCollections;


