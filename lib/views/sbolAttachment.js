
const { fetchSBOLObjectRecursive } = require('../fetch/fetch-sbol-object-recursive')
const { getContainingCollections } = require('../query/collection')
var filterAnnotations = require('../filterAnnotations')
const shareImages = require('../shareImages')
var sbolmeta = require('sbolmeta')
var async = require('async')
var pug = require('pug')
var sparql = require('../sparql/sparql-collate')
var wiky = require('../wiky/wiky.js');
var config = require('../config')
var URI = require('sboljs').URI
var getUrisFromReq = require('../getUrisFromReq')
const uriToUrl = require('../uriToUrl')
var sha1 = require('sha1');

module.exports = function(req, res) {

	var locals = {
        config: config.get(),
        section: 'attachment',
        user: req.user
    }

    var meta
    var attachment
    var collectionIcon 
    var remote

    var collections = []

    const { graphUri, uri, designId, share, url } = getUrisFromReq(req, res)

    fetchSBOLObjectRecursive(uri, graphUri).then((result) => {

        attachment = result.object
        remote = result.remote

        if(!attachment || attachment instanceof URI) {
            locals = {
                config: config.get(),
                section: 'errors',
                user: req.user,
                errors: [ uri + ' Record Not Found' ]
            }
            res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
            return
        }
        meta = sbolmeta.summarizeGenericTopLevel(attachment)
        if(!meta) {
            locals = {
                config: config.get(),
                section: 'errors',
                user: req.user,
                errors: [ uri + ' summarizeGenericTopLevel returned null' ]
            }
            res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
            return
        }

	if (meta.description != '') {
	    meta.description = wiky.process(meta.description, {})
	}

        meta.remote = remote

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

        locals.canEdit = false

        if(!remote && req.user) {

            const ownedBy = attachment.getAnnotations('http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy')
            const userUri = config.get('databasePrefix') + 'user/' + req.user.username

            if(ownedBy && ownedBy.indexOf(userUri) > -1) {

                locals.canEdit = true
		
            } 

        }

	meta.url = '/' + meta.uri.toString().replace(config.get('databasePrefix'),'')
	if (req.url.toString().endsWith('/share')) {
	    meta.url += '/' + sha1('synbiohub_' + sha1(meta.uri) + config.get('shareLinkSalt')) + '/share'
	}

	if (attachment.wasGeneratedBy) {
	    meta.wasGeneratedBy = { uri: attachment.wasGeneratedBy.uri?attachment.wasGeneratedBy.uri:attachment.wasGeneratedBy,
				    url: uriToUrl(attachment.wasGeneratedBy,req)
				  }
	}
	    
        locals.meta = meta

	locals.rdfType = {
        name: 'Attachment',
        url: "http://sbols.org/v2#Attachment"
	}

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

        locals.attachmentType = attachment.format.toString().replace('http://identifiers.org/combine.specifications/','').replace('http://identifiers.org/edam/','')
	
        locals.attachmentHash = attachment.hash


	locals.attachmentName = 'Attachment'
        if (attachment.source.toString().startsWith(config.get('databasePrefix'))) {
            locals.attachmentDownloadURL = '/' + attachment.source.toString().replace(config.get('databasePrefix'),'')
            if (attachment.source.toString().startsWith(config.get('databasePrefix')+'user/') && req.url.toString().endsWith('/share')) {
                locals.attachmentDownloadURL = locals.attachmentDownloadURL.replace('/download','') + '/' + sha1('synbiohub_' + sha1(attachment.source.toString().replace('/download','')) + config.get('shareLinkSalt')) + '/share/download'
            }            
        } else {
	    locals.attachmentDownloadURL = attachment.source
        }
	
        locals.size = attachment.size

        if(locals.attachmentDownloadURL instanceof URI) {
            locals.attachmentDownloadURL = locals.attachmentDownloadURL.toString()
        }

        locals.attachmentIsImage = attachment.format.toString().indexOf("png") >= 0 
                                || attachment.format.toString() == "http://identifiers.org/edam/format_3603" 
                                || attachment.format.toString().indexOf("imageAttachment") >= 0;

        locals.annotations = filterAnnotations(req,attachment.annotations);

        res.send(pug.renderFile('templates/views/attachment.jade', locals))

    }).catch((err) => {
    
        locals = {
            config: config.get(),
            section: 'errors',
            user: req.user,
            errors: [ err.stack ]
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



