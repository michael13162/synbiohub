import getCitationsForSubject from './getCitationsForSubject';


const { fetchSBOLObjectRecursive } = require('../fetch/fetch-sbol-object-recursive')
const { getComponentDefinitionMetadata } = require('../query/component-definition')
const { getContainingCollections } = require('../query/local/collection')

var filterAnnotations = require('../filterAnnotations')
const shareImages = require('../shareImages')
var loadTemplate = require('../loadTemplate')
var retrieveCitations = require('../citations')
var sbolmeta = require('sbolmeta')
var formatSequence = require('sequence-formatter')
var async = require('async')
var prefixify = require('../prefixify')
var pug = require('pug')
var sparql = require('../sparql/sparql-collate')
var getDisplayList = require('visbol/lib/getDisplayList')
var wiky = require('../wiky/wiky.js');
var config = require('../config')
var striptags = require('striptags')
var URI = require('sboljs').URI
var sha1 = require('sha1');
var getUrisFromReq = require('../getUrisFromReq')
const attachments = require('../attachments')
const uriToUrl = require('../uriToUrl')
const request = require('request')
var getIgemWiki = require('./get_igem_wiki')

module.exports = async function(req, res) {

	var locals = {
        config: config.get(),
        section: 'component',
        user: req.user
    }

    var baseUri

    var meta
    var sbol
    var componentDefinition
    var remote

    var collections = []

    var otherComponents = []
    var mappings = {}

    var builds = []

    var submissionCitations = []
    var citations = []

    var collectionIcon

    const { graphUri, uri, designId, share, url } = getUrisFromReq(req, res)

    
    let result = await fetchSBOLObjectRecursive('ComponentDefinition', uri, graphUri)

    sbol = result.sbol
    componentDefinition = result.object
    remote = result.remote || false

    if(!componentDefinition || componentDefinition instanceof URI) {
        return Promise.reject(new Error(uri + ' not found: ' + componentDefinition))
    }

    meta = sbolmeta.summarizeComponentDefinition(componentDefinition)

    if(!meta) {
        return Promise.reject(new Error('summarizeComponentDefinition returned null'))
    }



    const DOIs = componentDefinition.getAnnotations('http://edamontology.org/data_1188')
    const pubmedIDs = componentDefinition.getAnnotations('http://purl.obolibrary.org/obo/OBI_0001617')


    let collections = await getContainingCollections(uri, graphUri, req.url)

    let collectionsWithIcons = collections.filter((collection) => collection.icon)[0]

    if(collectionsWithIcons.length > 0)
        collectionIcon = collectionsWithIcons[0].icon


        
    let submissionCitations = await getCitationsForSubject(uri, graphUri)

	if(componentDefinition.wasDerivedFrom.toString().indexOf('http://parts.igem.org/') === 0) {
        meta = extend(meta, await getIgemWiki(componentDefinition.wasDerivedFrom))
	}



    var isDNA = 0

    meta.triplestore = graphUri ? 'private' : 'public'
    meta.remote = remote

    meta.attachments = attachments.getAttachmentsFromTopLevel(sbol, componentDefinition,
                              req.url.toString().endsWith('/share'))


    meta.builds = builds

    if (componentDefinition.wasGeneratedBy) {
        meta.wasGeneratedBy = { uri: componentDefinition.wasGeneratedBy.uri?componentDefinition.wasGeneratedBy.uri:componentDefinition.wasGeneratedBy,
            url: uriToUrl(componentDefinition.wasGeneratedBy,req)
        }
    }

    meta.types = meta.types.map((type) => {

        if (type.description && type.description.name === 'DnaRegion') isDNA = 1

        return {
            uri: type.uri,
            term: type.uri,
            description: type.description
        }

    })

    meta.roles = meta.roles.map((role) => {

        var igemPrefix = 'http://wiki.synbiohub.org/wiki/Terms/igem#partType/'

        if(!role.term && role.uri.indexOf(igemPrefix) === 0) {

            return {
                uri: role.uri,
                term: role.uri.slice(igemPrefix.length)
            }

        } else {

            return {
                uri: role.uri,
                term: role.uri,
                description: role.description
            }

        }

    })

    if (meta.description != '') {
        meta.description = wiky.process(meta.description.toString(), {})
        meta.description = meta.description.replace('<br/>', '')
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

    if (meta.isReplacedBy.uri != '') {
        meta.isReplacedBy.uri = '/' + meta.isReplacedBy.uri.toString().replace(config.get('databasePrefix'),'')
        meta.isReplacedBy.id = meta.isReplacedBy.uri.toString().replace('/public/','').replace('/1','') + ' '
        meta.isReplacedBy.id = meta.isReplacedBy.id.substring(meta.isReplacedBy.id.indexOf('/')+1)
    }

    if(req.params.userId) {
        meta.url = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId
    } else {
        meta.url = '/public/' + designId
    }
    //meta.url = '/' + meta.uri.toString().replace(config.get('databasePrefix'),'')
    if (req.url.toString().endsWith('/share')) {
        meta.url += '/' + sha1('synbiohub_' + sha1(meta.uri) + config.get('shareLinkSalt')) + '/share'
    }

    locals.meta = meta

    locals.components = componentDefinition.components
    
    for(let component of locals.components) {
        component.link()
        if (component.definition.uri) {
            if (component.definition.uri.toString().startsWith(config.get('databasePrefix'))) {
                component.url = '/'  + component.definition.uri.toString().replace(config.get('databasePrefix'),'')
            } else {
                component.url = component.definition.uri
            }
        } else {
            component.url = component.definition.toString()
        }
        component.typeStr = component.access.toString().replace('http://sbols.org/v2#','')
    }

    for(let sequence of locals.meta.sequences) {
        if (sequence.uri.toString().startsWith(config.get('databasePrefix'))) {
            sequence.url = '/'  + sequence.uri.toString().replace(config.get('databasePrefix'),'')
            if (sequence.uri.toString().startsWith(config.get('databasePrefix')+'user/') && req.url.toString().endsWith('/share')) {
                sequence.url += '/' + sha1('synbiohub_' + sha1(sequence.uri) + config.get('shareLinkSalt')) + '/share'
            }
        } else {
            sequence.url = sequence.uri
        }

        if(req.params.version === 'current') {
            sequence.url = sequence.url.toString().replace('/'+sequence.version, '/current')
            sequence.version = 'current'
        }
    }

    locals.rdfType = {
        name : 'Component',
        url : 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Component'
    }

    locals.share = share
    locals.BenchlingRemotes = (Object.keys(config.get('remotes')).filter(function(e){return config.get('remotes')[e].type ==='benchling'}).length > 0)
    locals.ICERemotes = (Object.keys(config.get('remotes')).filter(function(e){return config.get('remotes')[e].type ==='ice'}).length > 0)

    locals.keywords = []
    locals.prefix = req.params.prefix
    locals.removePublicEnabled = config.get('removePublicEnabled')

    locals.collections = collections

    // locals.meta.sequences.forEach((sequence) => {

    //     sequence.formatted = formatSequence(sequence.elements)

    //     sequence.blastUrl = sequence.type === 'AminoAcid' ?
    //         'http://blast.ncbi.nlm.nih.gov/Blast.cgi?PROGRAM=blastp&PAGE_TYPE=BlastSearch&LINK_LOC=blasthome' :
    //         'http://blast.ncbi.nlm.nih.gov/Blast.cgi?PROGRAM=blastn&PAGE_TYPE=BlastSearch&LINK_LOC=blasthome'

    // })

    locals.meta.description = locals.meta.description.split(';').join('<br/>')
    locals.metaDesc = striptags(locals.meta.description).trim()
    locals.title = locals.meta.name + ' ‒ ' + config.get('instanceName')

    locals.collectionIcon = collectionIcon
    locals.submissionCitations = submissionCitations
    locals.citationsSource = citations.map(function(citation) {
        return citation.citation
    }).join(',');

    if (isDNA) {
        locals.meta.displayList = getDisplayList(componentDefinition, config, req.url.toString().endsWith('/share'))
    }

    locals.canEdit = false

    if(!remote && req.user) {

        const ownedBy = componentDefinition.getAnnotations('http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy')
        const userUri = config.get('databasePrefix') + 'user/' + req.user.username

        if(ownedBy && ownedBy.indexOf(userUri) > -1) {

            locals.canEdit = true

        }

    }

    locals.annotations = filterAnnotations(req,componentDefinition.annotations);

    locals.annotations.forEach((annotation) => {
        if (annotation.name === 'benchling#edit' && req.params.version === 'current') {
            locals.remote = { name: 'Benchling',
                url: annotation.url
            }
        } else if (annotation.name === 'ice#entry' && req.params.version === 'current') {
            locals.remote = { name: 'ICE',
                url: annotation.url
            }
        }
    })

    res.send(pug.renderFile('templates/views/componentDefinition.jade', locals))
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
