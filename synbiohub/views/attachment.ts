
import getCitationsForSubject from './getCitationsForSubject';
import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import { getContainingCollections } from '../query/collection';
import filterAnnotations from '../filterAnnotations';
import shareImages from '../shareImages';
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

export default async function (req, res) {

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


    let result = await fetchSBOLObjectRecursive(uri, graphUri)

    attachment = result.object
    remote = result.remote

    if (!attachment || attachment instanceof URI) {
        locals = {
            config: config.get(),
            section: 'errors',
            user: req.user,
            errors: [uri + ' Record Not Found']
        }
        res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
        return
    }
    meta = sbolmeta.summarizeGenericTopLevel(attachment)
    if (!meta) {
        locals = {
            config: config.get(),
            section: 'errors',
            user: req.user,
            errors: [uri + ' summarizeGenericTopLevel returned null']
        }
        res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
        return
    }


    let collections = await getContainingCollections(uri, graphUri, req.url)

    let collectionsWithIcons = collections.filter((collection) => collection.icon)[0]

    if(collectionsWithIcons.length > 0)
        collectionIcon = collectionsWithIcons[0].icon


    if (meta.description != '') {
        meta.description = wiky.process(meta.description, {})
    }

    meta.remote = remote

    meta.mutableDescriptionSource = meta.mutableDescription.toString() || ''
    if (meta.mutableDescription.toString() != '') {
        meta.mutableDescription = shareImages(req, meta.mutableDescription.toString())
        meta.mutableDescription = wiky.process(meta.mutableDescription.toString(), {})
    }

    meta.mutableNotesSource = meta.mutableNotes.toString() || ''
    if (meta.mutableNotes.toString() != '') {
        meta.mutableNotes = shareImages(req, meta.mutableNotes.toString())
        meta.mutableNotes = wiky.process(meta.mutableNotes.toString(), {})
    }

    meta.sourceSource = meta.source.toString() || ''
    if (meta.source.toString() != '') {
        meta.source = shareImages(req, meta.source.toString())
        meta.source = wiky.process(meta.source.toString(), {})
    }

    locals.canEdit = false

    if (!remote && req.user) {

        const ownedBy = attachment.getAnnotations('http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy')
        const userUri = config.get('databasePrefix') + 'user/' + req.user.username

        if (ownedBy && ownedBy.indexOf(userUri) > -1) {

            locals.canEdit = true

        }

    }

    meta.url = '/' + meta.uri.toString().replace(config.get('databasePrefix'), '')
    if (req.url.toString().endsWith('/share')) {
        meta.url += '/' + sha1('synbiohub_' + sha1(meta.uri) + config.get('shareLinkSalt')) + '/share'
    }

    if (attachment.wasGeneratedBy) {
        meta.wasGeneratedBy = {
            uri: attachment.wasGeneratedBy.uri ? attachment.wasGeneratedBy.uri : attachment.wasGeneratedBy,
            url: uriToUrl(attachment.wasGeneratedBy, req)
        }
    }

    locals.meta = meta

    locals.rdfType = {
        name: 'Attachment',
        url: 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Attachment'
    }

    locals.share = share
    locals.sbolUrl = url + '/' + meta.id + '.xml'
    if (req.params.userId) {
        locals.searchUsesUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/uses'
        locals.searchTwinsUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/twins'
    } else {
        locals.searchUsesUrl = '/public/' + designId + '/uses'
        locals.searchTwinsUrl = '/public/' + designId + '/twins'
    }

    locals.keywords = []
    locals.citations = []
    locals.prefix = req.params.prefix

    locals.collections = collections

    locals.collectionIcon = collectionIcon

    locals.submissionCitations = await getCitationsForSubject(meta.uri, graphUri)

    locals.meta.description = locals.meta.description.split(';').join('<br/>')

    locals.attachmentType = attachment.getAnnotation('http://wiki.synbiohub.org/wiki/Terms/synbiohub#attachmentType')
    locals.attachmentHash = attachment.getAnnotation('http://wiki.synbiohub.org/wiki/Terms/synbiohub#attachmentHash')
    locals.attachmentDownloadURL = url + '/download'
    locals.size = attachment.getAnnotation('http://wiki.synbiohub.org/wiki/Terms/synbiohub#attachmentSize')

    locals.attachmentIsImage = locals.attachmentType === 'http://wiki.synbiohub.org/wiki/Terms/synbiohub#imageAttachment'

    locals.annotations = filterAnnotations(req, attachment.annotations);

    res.send(pug.renderFile('templates/views/attachment.jade', locals))
};

function listNamespaces(xmlAttribs) {

    var namespaces = [];

    Object.keys(xmlAttribs).forEach(function (attrib) {

        var tokens = attrib.split(':');

        if (tokens[0] === 'xmlns') {

            namespaces.push({
                prefix: tokens[1],
                uri: xmlAttribs[attrib]
            })
        }
    });

    return namespaces;
}



