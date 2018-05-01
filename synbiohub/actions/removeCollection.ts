import async from 'async';
import request from 'request';
import loadTemplate from '../loadTemplate';
import config from '../config';
import getUrisFromReq from '../getUrisFromReq';
import sparql from '../sparql/sparql';
import getOwnedBy from '../query/ownedBy';
import pug from 'pug';

export default async function(req, res) {

    req.setTimeout(0) // no timeout

    const { graphUri, uri, designId } = getUrisFromReq(req, res)

    if (!graphUri && !config.get('removePublicEnabled')) {

        res.status(500).send('Removing public submissions is not allowed')

    }

    var uriPrefix = uri.substring(0,uri.lastIndexOf('/'))
    uriPrefix = uriPrefix.substring(0,uriPrefix.lastIndexOf('/')+1)

    var templateParams = {
	collection: uri,
        uriPrefix: uriPrefix,
	version: req.params.version
    }

    var removeQuery = loadTemplate('sparql/removeCollection.sparql', templateParams)

    let ownedBy = await getOwnedBy(uri, graphUri)

    if(ownedBy.indexOf(config.get('databasePrefix') + 'user/' + req.user.username) === -1) {
        //res.status(401).send('not authorized to edit this submission')
    const locals = {
    config: config.get(),
    section: 'errors',
    user: req.user,
    errors: [ 'Not authorized to remove this submission' ]
        }
        res.send(pug.renderFile('templates/views/errors/errors.jade', locals))        
    }

    await sparql.deleteStaggered(removeQuery, graphUri)

    templateParams = {
            uri: uri
    }
    removeQuery = loadTemplate('sparql/remove.sparql', templateParams)

    await sparql.deleteStaggered(removeQuery, graphUri)
    
    res.redirect('/manage');

};
    