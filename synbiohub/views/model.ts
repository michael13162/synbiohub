
import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import { getContainingCollections } from '../query/local/collection';
import filterAnnotations from '../filterAnnotations';
import shareImages from '../shareImages';
import loadTemplate from '../loadTemplate';
import sbolmeta from 'sbolmeta';
import async from 'async';
import pug from 'pug';
import sparql from '../sparql/sparql-collate';
import wiky from '../wiky/wiky.js';
import config from '../config';
import { URI } from 'sboljs';
import getUrisFromReq from '../getUrisFromReq';
import uriToUrl from '../uriToUrl';
import sha1 from 'sha1';

export default function(req, res) {

	var locals = {
        config: config.get(),
        section: 'model',
        user: req.user
    }

    var meta
    var sbol
    var model
    var collectionIcon
    var remote

    var collections = []

    const { graphUri, uri, designId, share, url } = getUrisFromReq(req, res)

    var templateParams = {
        uri: uri
    }

    fetchSBOLObjectRecursive('Model', uri, graphUri).then((result) => {

        sbol = result.sbol
        model = result.object
	remote = result.remote || false

        if(!model || model instanceof URI) {
            locals = {
                config: config.get(),
                section: 'errors',
                user: req.user,
                errors: [ uri + ' Record Not Found' ]
            }
            res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
            return
        }

        meta = sbolmeta.summarizeModel(model)
        if(!meta) {
            locals = {
                config: config.get(),
                section: 'errors',
                user: req.user,
                errors: [ uri + ' summarizeModel returned null' ]
            }
            res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
            return
        }

    }).then(function renderView() {

	if (meta.description != '') {
	    meta.description = wiky.process(meta.description, {})
	}

        meta.mutableDescriptionSource = meta.mutableDescription.toString() || ''
        if (meta.mutableDescription.toString() != '') {
	    meta.mutableDescription = shareImages(req,meta.mutableDescription.toString())
            meta.mutableDescription = wiky.process(meta.mutableDescription.toString(), {})
        }

        meta.mutableNotesSource = meta.mutableNotes.toString() || ''
        if (meta.mutableNotes.toString() != '') {
	    meta.mutableNotes = shareImages(req,meta.mutableNotes.toString())
            meta.mutableNotes = wiky.process(meta.mutableNotes.toString(), {})
        }

        meta.sourceSource = meta.source.toString() || ''
        if (meta.source.toString() != '') {
	    meta.source = shareImages(req,meta.source.toString())
            meta.source = wiky.process(meta.source.toString(), {})
        }

	meta.url = '/' + meta.uri.toString().replace(config.get('databasePrefix'),'')
	if (req.url.toString().endsWith('/share')) {
	    meta.url += '/' + sha1('synbiohub_' + sha1(meta.uri) + config.get('shareLinkSalt')) + '/share'
	}

	if (meta.modelSource.toString().startsWith(config.get('databasePrefix'))) {
	    meta.modelSource = '/' + meta.modelSource.toString().replace(config.get('databasePrefix'),'')
	    meta.modelSourceName = 'Attachment'
	} else {
	    meta.modelSourceName = meta.modelSource
	}

	if (model.wasGeneratedBy) {
	    meta.wasGeneratedBy = { uri: model.wasGeneratedBy.uri?model.wasGeneratedBy.uri:model.wasGeneratedBy,
				    url: uriToUrl(model.wasGeneratedBy,req)
				  }
	}
								  
        locals.meta = meta

        locals.meta.triplestore = graphUri ? 'private' : 'public'

        locals.canEdit = false
        locals.meta.remote = remote

        if(!remote && req.user) {

            const ownedBy = model.getAnnotations('http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy')
            const userUri = config.get('databasePrefix') + 'user/' + req.user.username

            if(ownedBy && ownedBy.indexOf(userUri) > -1) {

                locals.canEdit = true
		
            } 

        }

	locals.rdfType = {
	    name : 'Model',
	    url : 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Model'
	}

        locals.annotations = filterAnnotations(req,model.annotations);

	locals.share = share
        locals.sbolUrl = url + '/' + meta.id + '.xml'
        if(req.params.userId) {
            locals.searchUsesUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/uses'
            locals.searchTwinsUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/twins'
	} else {
            locals.searchUsesUrl = '/public/' + designId + '/uses'
            locals.searchTwinsUrl = '/public/' + designId + '/twins'
	} 

        locals.keywords = []
        locals.prefix = req.params.prefix

        locals.collections = collections
        locals.collectionIcon = collectionIcon

        locals.meta.description = locals.meta.description.split(';').join('<br/>')

        res.send(pug.renderFile('templates/views/model.jade', locals))

    }).catch((err) => {
        
        locals = {
            config: config.get(),
            section: 'errors',
            user: req.user,
            errors: [ err ]
        }
        res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
    })
	
};

function listNamespaces(xmlAttribs) {

    var namespaces = [];

    Object.keys(xmlAttribs).forEach(function(attrib) {

        var tokens = attrib.split(':');

        if(tokens[0] === 'xmlns') {

            namespaces.push({
                prefix: tokens[1],
                uri: xmlAttribs[attrib]
            })
        }
    });

    return namespaces;
}


