
import { getRootCollectionMetadata } from '../query/collection';

async function rootCollections(req, res) {

    let collections = getRootCollectionMetadata(null,req.user)

	console.log('getRoot : ' + JSON.stringify(req.user))

	var results

	if (req.user) {
		results = await Promise.all([
			getRootCollectionMetadata(null, req.user),
			getRootCollectionMetadata(req.user.graphUri, req.user)
		])
	} else {
		results = await Promise.all([
			getRootCollectionMetadata(null, req.user),
		])
	}

	var collections = []

	results.forEach((result) => {
		collections = collections.concat(result)
	})

	res.header('content-type', 'application/json').send(JSON.stringify(collections))

}

export default rootCollections;

