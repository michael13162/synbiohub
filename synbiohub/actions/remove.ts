import async from 'async';
import request from 'request';
import loadTemplate from '../loadTemplate';
import config from '../config';
import getUrisFromReq from '../getUrisFromReq';
import sparql from '../sparql/sparql';
import getOwnedBy from '../query/ownedBy';
import pug from 'pug';
import { getType } from '../query/type';

export default async function(req, res) {

    req.setTimeout(0) // no timeout

    const { graphUri, uri, designId, edit } = getUrisFromReq(req, res)

    var uriPrefix = uri.substring(0,uri.lastIndexOf('/')+1)

    var templateParams = {
	uri: uri
    }

    var removeQuery = loadTemplate('sparql/remove.sparql', templateParams)

    var type = await getType(uri, graphUri)

    if (type == 'http://sbols.org/v2#Implementation'){

      var removeQuery = loadTemplate('sparql/removeImplementation.sparql', templateParams)
    }

    var ownedBy = await getOwnedBy(uri, graphUri)

    if(!edit && (!req.user || !req.user.username ||
      ownedBy.indexOf(config.get('databasePrefix') + 'user/' + req.user.username) === -1)) {
        console.log('not authorized')
        //res.status(401).send('not authorized to edit this submission')
        if (!req.accepts('text/html')) {
          res.status(500).type('text/plain').send('Not authorized to remove this submission')
          return
        }  else {
          const locals = {
            config: config.get(),
            section: 'errors',
            user: req.user,
            errors: [ 'Not authorized to remove this submission' ]
          }
          res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
        }
          }

  await sparql.deleteStaggered(removeQuery, graphUri)

  var templateParams = {
    uri: uri,
  }

  removeQuery = loadTemplate('sparql/removeReferences.sparql', templateParams)

  await sparql.deleteStaggered(removeQuery, graphUri)

  res.redirect('/manage');

  };
