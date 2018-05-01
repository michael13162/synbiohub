
import async from 'async';
import request from 'request';
import loadTemplate from '../loadTemplate';
import config from '../config';
import getUrisFromReq from '../getUrisFromReq';
import splitUri from '../splitUri';
import sparql from '../sparql/sparql';

export default function(req, res) {

    req.setTimeout(0) // no timeout

    const { graphUri, uri, designId, baseUri } = getUrisFromReq(req, res)

    var implementationId = req.params.displayId.replace('_implementation', '_test')
    var implementationVersion = '1'
    var implementationPersistentIdentity = baseUri + '/' + implementationId
    var implementationUri = implementationPersistentIdentity + '/' + implementationVersion

    const userUri = config.get('databasePrefix') + 'user/' + req.user.username

    var templateParams = {
        uri: sparql.escapeIRI(implementationUri),
        persistentIdentity: sparql.escapeIRI(implementationPersistentIdentity),
        displayId: JSON.stringify(implementationId),
        version: JSON.stringify(implementationVersion),
        testFor: sparql.escapeIRI(uri),
        ownedBy: userUri
    }


    var query = loadTemplate('sparql/CreateTest.sparql', templateParams)

	sparql.updateQuery(query, graphUri).then((r) => {

            console.log(r)
            res.redirect('/'+implementationUri.replace(config.get('databasePrefix'),''))
        
    }).catch((err) => {

        res.status(500).send(err.stack)
                
    })
};

