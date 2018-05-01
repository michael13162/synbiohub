import getCitationsForSubject from './getCitationsForSubject';

const { fetchSBOLObjectRecursive } = require('../fetch/fetch-sbol-object-recursive')
const { getContainingCollections } = require('../query/local/collection')

var filterAnnotations = require('../filterAnnotations')

const shareImages = require('../shareImages')

var loadTemplate = require('../loadTemplate')

var sbolmeta = require('sbolmeta')

var async = require('async')

var pug = require('pug')

var sparql = require('../sparql/sparql-collate')

var wiky = require('../wiky/wiky.js');

var config = require('../config')

var URI = require('sboljs').URI

var getUrisFromReq = require('../getUrisFromReq')

const attachments = require('../attachments')

const uriToUrl = require('../uriToUrl')

var sha1 = require('sha1');

module.exports = async function(req, res) {

    var locals = {
        config: config.get(),
        section: 'component',
        user: req.user
    }

    var meta
    var sbol
    var genericTopLevel
    var collectionIcon 
    var remote

    var collections = []

    const { graphUri, uri, designId, share, url } = getUrisFromReq(req, res)

    var templateParams = {
        uri: uri
    }






    let result = await fetchSBOLObjectRecursive(uri, graphUri)

    sbol = result.sbol
    genericTopLevel = result.object
    remote = result.remote

    if(!genericTopLevel || genericTopLevel instanceof URI) {
        locals = {
            config: config.get(),
            section: 'errors',
            user: req.user,
            errors: [ uri + ' Record Not Found: ' + genericTopLevel ]
        }
        res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
        return Promise.reject()
    }
    meta = sbolmeta.summarizeGenericTopLevel(genericTopLevel)
    if(!meta) {
        locals = {
            config: config.get(),
            section: 'errors',
            user: req.user,
            errors: [ uri + ' summarizeGenericTopLevel returned null' ]
        }
        res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
        return Promise.reject()
    }





    let collections = await getContainingCollections(uri, graphUri, req.url)

    collections.forEach((collection) => {

        collection.url = uriToUrl(collection.uri)

        const collectionIcons = config.get('collectionIcons')

        if(collectionIcons[collection.uri])
            collectionIcon = collectionIcons[collection.uri]
    })



    let submissionCitations = await getCitationsForSubject(uri, graphUri)


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

    meta.attachments = await getAttachmentsForSubject(uri, graphUri)

    locals.canEdit = false

    if(!remote && req.user) {

        const ownedBy = genericTopLevel.getAnnotations('http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy')
        const userUri = config.get('databasePrefix') + 'user/' + req.user.username

        if(ownedBy && ownedBy.indexOf(userUri) > -1) {

            locals.canEdit = true

        } 

    }

    meta.url = '/' + meta.uri.toString().replace(config.get('databasePrefix'),'')
    if (req.url.toString().endsWith('/share')) {
        meta.url += '/' + sha1('synbiohub_' + sha1(meta.uri) + config.get('shareLinkSalt')) + '/share'
    }

    if (genericTopLevel.wasGeneratedBy) {
        meta.wasGeneratedBy = { uri: genericTopLevel.wasGeneratedBy.uri?genericTopLevel.wasGeneratedBy.uri:genericTopLevel.wasGeneratedBy,
            url: uriToUrl(genericTopLevel.wasGeneratedBy,req)
        }
    }

    locals.meta = meta

    locals.meta.triplestore = graphUri ? 'private' : 'public'
    locals.meta.remote = remote

    locals.rdfType = {
        name : genericTopLevel.rdfType?genericTopLevel.rdfType.slice(genericTopLevel.rdfType.lastIndexOf('/')+1):'unknown',
        url : genericTopLevel.rdfType
    }

    locals.annotations = filterAnnotations(req,genericTopLevel.annotations);

    locals.share = share
    locals.sbolUrl = url + '/' + meta.id + '.xml'
    if(req.params.userId) {
        locals.searchUsesUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/uses'
        locals.makePublic = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/makePublic'
        locals.remove = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/remove'
    } else {
        locals.searchUsesUrl = '/public/' + designId + '/uses'
        locals.remove = '/public/' + designId + '/remove'
    } 

    locals.keywords = []
    locals.citations = []
    locals.prefix = req.params.prefix

    locals.collections = collections

    locals.collectionIcon = collectionIcon

    locals.submissionCitations = submissionCitations

    locals.meta.description = locals.meta.description.split(';').join('<br/>')

    res.send(pug.renderFile('templates/views/genericTopLevel.jade', locals))

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



