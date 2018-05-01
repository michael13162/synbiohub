
var getAttachmentsForSubject = require('./getAttachmentsForSubject');

const { getCollectionMetaData,
    getCollectionMembers,
    getCollectionMemberCount,
    getContainingCollections
} = require('../query/collection')

const getOwnedBy = require('../query/ownedBy')

var filterAnnotations = require('../filterAnnotations')

var loadTemplate = require('../loadTemplate')

var sbolmeta = require('sbolmeta')

var formatSequence = require('sequence-formatter')

var async = require('async')

var sparql = require('../sparql/sparql-collate')

var prefixify = require('../prefixify')

var pug = require('pug')

var getDisplayList = require('visbol/lib/getDisplayList')

var config = require('../config')

var wiky = require('../wiky/wiky.js');

var getCitationsForSubject = require('./getCitationsForSubject')

var getUrisFromReq = require('../getUrisFromReq')

var sha1 = require('sha1');

var util = require('../util');

const uriToUrl = require('../uriToUrl')

const getAttachmentsFromList = require('../attachments')

const shareImages = require('../shareImages')

module.exports = function (req, res) {

    console.log('collection view')

    var locals = {
        config: config.get(),
        section: 'collection',
        user: req.user
    }

    var collections = []
    var citations = []

    var offset = 0
    if (req.query.offset) {
        offset = req.query.offset
    }
    var limit = config.get('defaultLimit')
    if (req.query.limit) {
        limit = req.query.limit
    }

    const { graphUri, uri, designId, share, url } = getUrisFromReq(req, res)

    var sbol
    var collection

    var mappings = {}

    var members = []

    var memberCount = 0

    var collectionIcon

    const collectionIcons = config.get('collectionIcons')

    if (collectionIcons[uri])
        collectionIcon = collectionIcons[uri]

    var templateParams = {
        uri: uri
    }


    let metaData = await getCollectionMetaData(uri, graphUri)

    let collections = await getContainingCollections(uri, graphUri)

    var attachments = await getAttachmentsForSubject(uri, graphUri)


    var sbolNS = 'http://sbols.org/v2#'
    members.sort((a, b) => {
        if (a.type.endsWith(sbolNS + 'Collection') && !b.type.endsWith(sbolNS + 'Collection')) {
            return -1
        } else if (b.type.endsWith(sbolNS + 'Collection') && !a.type.endsWith(sbolNS + 'Collection')) {
            return 1
        } if (a.type.endsWith(sbolNS + 'ModuleDefinition') && !b.type.endsWith(sbolNS + 'ModuleDefinition')) {
            return -1
        } else if (b.type.endsWith(sbolNS + 'ModuleDefinition') && !a.type.endsWith(sbolNS + 'ModuleDefinition')) {
            return 1
        } if (a.type.endsWith(sbolNS + 'Model') && !b.type.endsWith(sbolNS + 'Model')) {
            return -1
        } else if (b.type.endsWith(sbolNS + 'Model') && !a.type.endsWith(sbolNS + 'Model')) {
            return 1
        } if (a.type.endsWith(sbolNS + 'ComponentDefinition') && !b.type.endsWith(sbolNS + 'ComponentDefinition')) {
            return -1
        } else if (b.type.endsWith(sbolNS + 'ComponentDefinition') && !a.type.endsWith(sbolNS + 'ComponentDefinition')) {
            return 1
        } if (a.type.endsWith(sbolNS + 'Sequence') && !b.type.endsWith(sbolNS + 'Sequence')) {
            return -1
        } else if (b.type.endsWith(sbolNS + 'Sequence') && !a.type.endsWith(sbolNS + 'Sequence')) {
            return 1
        } else {
            return ((a.displayId < b.displayId) ? -1 : ((a.displayId > b.displayId) ? 1 : 0));
        }
    })

    locals.collections = collections

    var removed = 0
    var created = metaData.created
    if (created) {
        created = created.toString().replace('T', ' ').replace('Z', '')
        if (created.indexOf('.') > 0) {
            created = created.substring(0, metaData.created.indexOf('.'))
        }
    }
    var modified = metaData.modified
    if (modified) {
        modified = modified.toString().replace('T', ' ').replace('Z', '')
        if (modified.indexOf('.') > 0) {
            modified = modified.substring(0, metaData.modified.indexOf('.'))
        }
    }

    if (metaData.mutableDescription && metaData.mutableDescription != '') {
    metaData.mutableDescription = shareImages(req,metaData.mutableDescription)
        metaData.mutableDescriptionSource = metaData.mutableDescription
        metaData.mutableDescription = wiky.process(metaData.mutableDescription, {})
    }

    if (metaData.mutableNotes && metaData.mutableNotes != '') {
    metaData.mutableNotes = shareImages(req,metaData.mutableNotes)
        metaData.mutableNotesSource = metaData.mutableNotes
        metaData.mutableNotes = wiky.process(metaData.mutableNotes, {})
    }

    if (metaData.mutableProvenance && metaData.mutableProvenance != '') {
    metaData.mutableProvenance = shareImages(req,metaData.mutableProvenance)
        metaData.mutableProvenanceSource = metaData.mutableProvenance
        metaData.mutableProvenance = wiky.process(metaData.mutableProvenance, {})
    }

    locals.meta = {
        uri: uri + '',
        url: uriToUrl(uri + ''),
        id: metaData.displayId,
        pid: metaData.persistentIdentity,
        wasDerivedFrom: metaData.wasDerivedFrom || '',
        wasGeneratedBy: { uri: metaData.wasGeneratedBy || '',
                url: uriToUrl(metaData.wasGeneratedBy,req)
            },
        version: metaData.version,
        name: metaData.name,
        description: metaData.description || '',
        creator: { description: metaData.creator || '' },
        created: { description: created || '' },
        modified: { description: modified || '' },
        mutableDescriptionSource: metaData.mutableDescriptionSource || '',
        mutableDescription: metaData.mutableDescription || '',
        mutableNotesSource: metaData.mutableNotesSource || '',
        mutableNotes: metaData.mutableNotes || '',
        sourceSource: metaData.mutableProvenanceSource || '',
        source: metaData.mutableProvenance || '',
        attachments: attachments,
        triplestore: graphUri ? 'private' : 'public',
        graphUri: graphUri,
        //triplestore: graphUri === config.get('triplestore').defaultGraph ? 'public' : 'private',

        numComponents: members.length,

        members: members.map((member) => {
            if (!member.displayId) removed++
            memberUrl = uriToUrl(member.uri)
            if (member.uri.toString().startsWith(config.get('databasePrefix'))) {
                if (req.url.toString().endsWith('/share')) {
                    memberUrl += '/' + sha1('synbiohub_' + sha1(member.uri) + config.get('shareLinkSalt')) + '/share'
                }
            }

            const typeLocalPart = member.type.slice(member.type.lastIndexOf('#') + 1)

    var memberTypeUrl = member.type
    var memberType = typeLocalPart
    
    if (typeLocalPart === 'Collection') {
        memberTypeUrl = 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Collection'
        memberType = 'Collection'
    } else if (typeLocalPart === 'ComponentDefinition') {
        memberTypeUrl = 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Part'
        memberType = 'Component'
    } else if (typeLocalPart === 'ModuleDefinition') {
        memberTypeUrl = 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Device'
        memberType = 'Module'
    } else if (typeLocalPart === 'Sequence') {
        memberTypeUrl = 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Sequence'
        memberType = 'Sequence'
    } else if (typeLocalPart === 'Model') {
        memberTypeUrl = 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Model'
        memberType = 'Model'
    } else if (typeLocalPart === 'Attachment') {
        memberTypeUrl = 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Attachment'
        memberType = 'Attachment'
    } 


            if (member.description) {
                member.description = member.description.length < 100 ? member.description : member.description.substring(0, 200) + '...'
            }

            return {
                id: member.displayId,
                name: member.name ? member.name : member.displayId,
                description: member.description,
                type: memberType,
                typeUrl: memberTypeUrl,
                url: memberUrl
            }

        })

    }

if (req.url.toString().endsWith('/share')) {
    locals.meta.url += '/' + sha1('synbiohub_' + sha1(locals.meta.uri) + config.get('shareLinkSalt')) + '/share'
}

locals.rdfType = {
    name : 'Collection',
    url : 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Collection'
}

    locals.offset = offset
    locals.limit = limit
    locals.memberCount = memberCount
    locals.firstNum = (parseInt(offset) + 1)
    locals.lastNum = (parseInt(offset) + parseInt(limit))
    if (locals.lastNum > memberCount) locals.lastNum = memberCount
    locals.previous = (locals.firstNum - (parseInt(limit) + 1))
    locals.next = locals.lastNum
    if (req.originalUrl.indexOf("/?offset") !== -1) {
        locals.originalUrl = req.originalUrl.substring(0, req.originalUrl.indexOf("/?offset"))
    } else {
        locals.originalUrl = req.originalUrl
    }
    locals.collectionIcon = collectionIcon
    locals.numMembers = 10000
    locals.meta.numComponents = locals.meta.numComponents - removed
    locals.meta.members.forEach((annotation) => {
        var namespaces = listNamespaces(config.get("namespaces")).filter(function (namespace) {
            return annotation.type.indexOf(namespace.uri) === 0;
        });
        if (namespaces.length != 0) {
            var namespace = namespaces.sort((a, b) => a.uri.length - b.uri.length)[0];
            var prefixedName = namespace.prefix + ':' + annotation.type.slice(namespace.uri.length);
            annotation.type = prefixedName
        }
    })
    locals.share = share
    locals.submissionCitations = await getCitationsForSubject(graphUri, uri)
    if (req.params.userId) {
        locals.makePublic = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/makePublic'
        locals.remove = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/remove'
    } else {
        locals.copyFromRemote = '/public/' + designId + '/copyFromRemote'
        locals.remove = '/public/' + designId + '/remove'
    }
    locals.meta.remote = metaData.remote

    locals.keywords = []
    locals.citationsSource = citations.map(function (citation) {
        return citation.citation
    }).join(',');

    locals.title = metaData.name + ' ‒ ' + config.get('instanceName')

    if (metaData.description) {
        locals.metaDesc = metaData.description
    } else if (metaData.mutableDescription) {
        locals.metaDesc = metaData.mutableDescription
    } else {
        locals.metaDesc = 'Collection containing ' + members.length + ' member(s)'
    }

    if (metaData.wasDerivedFrom) {
        locals.metaDesc += '.  Derived from ' + metaData.wasDerivedFrom
    }

    locals.canEdit = false

    let ownedBy = await getOwnedBy(uri, graphUri)

    if (!metaData.remote && req.user) {

        const userUri = config.get('databasePrefix') + 'user/' + req.user.username

        if (ownedBy && ownedBy.indexOf(userUri) > -1) {

            locals.canEdit = true

        }

    }

    var annotations = ownedBy.map(owner => {
        return {
            name: 'http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy',
            type: 'uri',
            value: owner
        }
    })

    locals.annotations = filterAnnotations(req, annotations);

    res.send(pug.renderFile('templates/views/collection.jade', locals))
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

