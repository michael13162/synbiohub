
import pug from 'pug'
import sparql from 'synbiohub/sparql/sparql'
import loadTemplate from 'synbiohub/loadTemplate'
import config from 'synbiohub/config'
import getGraphUriFromTopLevelUri from 'synbiohub/getGraphUriFromTopLevelUri'
import getOwnedBy from 'synbiohub/query/ownedBy'
import retrieveUris from 'synbiohub/retrieveUris'

export default async function (req, res) {

    const uri = req.body.uri;
    const userUri = req.body.user;

    const graphUri = getGraphUriFromTopLevelUri(uri, req.user);

    var d = new Date();
    var modified = d.toISOString();

    modified = modified.substring(0, modified.indexOf('.'));
    modified = JSON.stringify(modified);

    const sharedAdditionQuery = loadTemplate('./sparql/AddToSharedCollection.sparql', {
        uri: uri,
        userUri: userUri
    });

    let ownedBy = await getOwnedBy(uri, graphUri)

    if (ownedBy.indexOf(config.get('databasePrefix') + 'user/' + req.user.username) === -1) {
        //res.status(401).send('not authorized to edit this submission')
        return new Promise(function (resolve, reject) {
            reject(new Error('not authorized to add an owner'))
        })
    }

    await sparql.updateQuery(sharedAdditionQuery, userUri)

    let uris = await retrieveUris(uri, graphUri);


    let chunks = [];
    let offset = config.get('resolveBatch');

    for (let i = 0; i < uris.length; i += offset) {
        let end = i + offset < uris.length ? i + offset : uris.length;

        chunks.push(uris.slice(i, end));
    }

    return Promise.all(chunks.map(chunk => {

        let uris = chunk.map(uri => {
            return '<' + uri + '> sbh:ownedBy <' + userUri + '>';
        }).join(' . \n');

        const updateQuery = loadTemplate('./sparql/AddOwnedBy.sparql', {
            uris: uris
        });

        return sparql.updateQuery(updateQuery, graphUri);

    }))
}

