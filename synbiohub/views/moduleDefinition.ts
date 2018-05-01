

import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import { getModuleDefinitionMetadata } from '../query/module-definition';
import { getContainingCollections } from '../query/local/collection';
import filterAnnotations from '../filterAnnotations';
import sbolmeta from 'sbolmeta';
import shareImages from '../shareImages';
import loadTemplate from '../loadTemplate';
import sbolmeta from 'sbolmeta';
import formatSequence from 'sequence-formatter';
import async from 'async';
import prefixify from '../prefixify';
import pug from 'pug';
import sparql from '../sparql/sparql-collate';
import getDisplayList from 'visbol/lib/getDisplayList';
import wiky from '../wiky/wiky.js';
import config from '../config';
import { URI } from 'sboljs';
import sha1 from 'sha1';
import getUrisFromReq from '../getUrisFromReq';
import uriToUrl from '../uriToUrl';

export default function(req, res) {

	var locals = {
        config: config.get(),
        section: 'module',
        user: req.user
    }

    var meta
    var moduleDefinition
    var collectionIcon
    var remote

    var collections = []


    var otherModules = []
    var mappings = {}

    var sbol

		var builds = []

    const { graphUri, uri, designId, share, url } = getUrisFromReq(req, res)

    var templateParams = {
        uri: uri
    }

    fetchSBOLObjectRecursive('ModuleDefinition', uri, graphUri).then((result) => {

        sbol = result.sbol
        moduleDefinition = result.object
        remote = result.remote

        if(!moduleDefinition || moduleDefinition instanceof URI) {
            locals = {
                config: config.get(),
                section: 'errors',
                user: req.user,
                errors: [ uri + ' Record Not Found' ]
            }
            res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
            return
        }

        meta = sbolmeta.summarizeModuleDefinition(moduleDefinition)
        if(!meta) {
            locals = {
                config: config.get(),
                section: 'errors',
                user: req.user,
                errors: [ uri + ' summarizeModuleDefinition returned null' ]
            }
            res.send(pug.renderFile('templates/views/errors/errors.jade', locals))
            return
        }

    }).then(function lookupBuilds() {

        var templateParams = {
            uri: uri
        }

				console.log('param ' + uri)
        var query = loadTemplate('sparql/getImplementations.sparql', templateParams)

        return sparql.queryJson(query, graphUri).then((results) => {
						// console.log(results)
						results = JSON.parse(JSON.stringify(results))
						console.log(results)
						for(impl of results){
							console.log(impl)

							builds.push(impl['s'])

						}

						console.log(builds)

            // builds = results.map((result) => {
						// 		console.log(result)
            //     return result.impl
            // })

        })

				meta.builds = builds

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

        meta.attachments = attachments.getAttachmentsFromTopLevel(sbol, moduleDefinition,
								  req.url.toString().endsWith('/share'))

        meta.url = '/' + meta.uri.toString().replace(config.get('databasePrefix'),'')

	if (moduleDefinition.wasGeneratedBy) {
	    meta.wasGeneratedBy = { uri: moduleDefinition.wasGeneratedBy.uri?moduleDefinition.wasGeneratedBy.uri:moduleDefinition.wasGeneratedBy,
				    url: uriToUrl(moduleDefinition.wasGeneratedBy,req)
				  }
	}

	if (req.url.toString().endsWith('/share')) {
	    meta.url += '/' + sha1('synbiohub_' + sha1(meta.uri) + config.get('shareLinkSalt')) + '/share'
	}

	locals.rdfType = {
	    name : 'Module',
	    url : 'http://wiki.synbiohub.org/wiki/Terms/SynBioHub#Module'
	}

        locals.meta = meta
        locals.modules = moduleDefinition.modules
        locals.modules.forEach((module) => {
            if (module.definition.uri) {
                module.defId = module.definition.displayId
                module.defName = module.definition.name
		console.log(module.definition.uri.toString())
		console.log(config.get('databasePrefix'))
                if (module.definition.uri.toString().startsWith(config.get('databasePrefix'))) {
                    module.url = '/' + module.definition.uri.toString().replace(config.get('databasePrefix'),'')
		    if (module.definition.uri.toString().startsWith(config.get('databasePrefix')+'user/') && req.url.toString().endsWith('/share')) {
			module.url += '/' + sha1('synbiohub_' + sha1(module.definition.uri.toString()) + config.get('shareLinkSalt')) + '/share'
		    }
                } else {
                    module.url = module.definition.uri.toString()
		}
            } else {
                module.defId = module.definition.toString()
                module.defName = ''
                module.url = module.definition.toString()
            }
        })
        locals.roles = moduleDefinition.roles
        locals.models = moduleDefinition.models
        locals.models.forEach((model) => {
            if (model.uri) {
                if (model.uri.toString().startsWith(config.get('databasePrefix'))) {
                    model.url = '/' + model.uri.toString().replace(config.get('databasePrefix'),'')
		    if (model.uri.toString().startsWith(config.get('databasePrefix')+'user/') && req.url.toString().endsWith('/share')) {
			model.url += '/' + sha1('synbiohub_' + sha1(model.uri.toString()) + config.get('shareLinkSalt')) + '/share'
		    }
                } else {
                    model.url = model.uri.toString()
                }
                model.version = model.uri.toString().substring(model.uri.toString().lastIndexOf('/')+1)
                var persId = model.uri.toString().substring(0,model.uri.toString().lastIndexOf('/'))
                model.id = persId.substring(persId.lastIndexOf('/')+1)
            } else {
                model.url = model.toString()
                model.id = model.toString()
                model.name = ''
            }
        })
        locals.functionalComponents = moduleDefinition.functionalComponents
        locals.functionalComponents.forEach((functionalComponent) => {
            functionalComponent.link()
            if (functionalComponent.definition.uri) {
                functionalComponent.defId = functionalComponent.definition.displayId
                functionalComponent.defName= functionalComponent.definition.name
                if (functionalComponent.definition.uri.toString().startsWith(config.get('databasePrefix'))) {
                    functionalComponent.url = '/' + functionalComponent.definition.uri.toString().replace(config.get('databasePrefix'),'')
		    if (functionalComponent.definition.uri.toString().startsWith(config.get('databasePrefix')+'user/') && req.url.toString().endsWith('/share')) {
			functionalComponent.url += '/' + sha1('synbiohub_' + sha1(functionalComponent.definition.uri.toString()) + config.get('shareLinkSalt')) + '/share'
		    }
                } else {
                    functionalComponent.url = functionalComponent.definition.uri.toString()
		}
            } else {
                functionalComponent.defId = functionalComponent.definition.toString()
                functionalComponent.defName = ''
                functionalComponent.url = functionalComponent.definition.toString()
            }
            functionalComponent.typeStr = functionalComponent.access.toString().replace('http://sbols.org/v2#','') + ' '
                + functionalComponent.direction.toString().replace('http://sbols.org/v2#','').replace('none','')
        })
	locals.interactions = moduleDefinition.interactions
        locals.interactions.forEach((interaction) => {
	    interaction.typeStr = ''
	    interaction.types.forEach((type) => {
                var sboPrefix = 'http://identifiers.org/biomodels.sbo/'
		if(type.toString().indexOf(sboPrefix) === 0) {
		    var sboTerm = type.toString().slice(sboPrefix.length).split('_').join(':')
    		    interaction.typeStr = sbolmeta.systemsBiologyOntology[sboTerm].name
		    interaction.typeURL = type.toString()
		}
	    })
	    interaction.defId = interaction.displayId
	    interaction.defName = interaction.name?interaction.name:interaction.displayId
	    interaction.participations.forEach((participation) => {
		participation.roleStr = ''
		participation.roles.forEach((role) => {
                    var sboPrefix = 'http://identifiers.org/biomodels.sbo/'
		    if(role.toString().indexOf(sboPrefix) === 0) {
			var sboTerm = role.toString().slice(sboPrefix.length).split('_').join(':')
    			participation.roleStr = sbolmeta.systemsBiologyOntology[sboTerm].name
			participation.roleURL = role.toString()
		    }
		})
		if (participation.participant.definition.uri) {
		    if (participation.participant.definition.uri.toString().startsWith(config.get('databasePrefix'))) {
			participation.url = '/' + participation.participant.uri.toString().replace(config.get('databasePrefix'),'')
			if (participation.participant.definition.uri.toString().startsWith(config.get('databasePrefix')+'user/') && req.url.toString().endsWith('/share')) {
			    participation.participant.url += '/' + sha1('synbiohub_' + sha1(participation.participant.definition.uri.toString()) + config.get('shareLinkSalt')) + '/share'
			}
		    } else {
			participation.participant.url = participation.participant.definition.uri.toString()
		    }
                    participation.participant.defId = participation.participant.definition.displayId
                    participation.participant.defName = participation.participant.definition.name?participation.participant.definition.name:participation.participant.definition.displayId
		}else {
                    participation.participant.defId = participation.participant.displayId
                    participation.participant.defName = participation.participant.name?participation.participant.name:participation.participant.displayId
                    participation.participant.url = participation.participant.definition.toString()
		}
	    })
	})

	locals.share = share
        locals.sbolUrl = url + '/' + moduleDefinition.displayId + '.xml'
        if(req.params.userId) {
            locals.searchUsesUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/uses'
        } else {
            locals.searchUsesUrl = '/public/' + designId + '/uses'
        }

        locals.canEdit = false

        if(!remote && req.user) {

            const ownedBy = moduleDefinition.getAnnotations('http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy')
            const userUri = config.get('databasePrefix') + 'user/' + req.user.username

            if(ownedBy && ownedBy.indexOf(userUri) > -1) {

                locals.canEdit = true

            }

        }

        locals.annotations = filterAnnotations(req,moduleDefinition.annotations);

        locals.keywords = []
        locals.citations = []
        locals.prefix = req.params.prefix
        locals.collectionIcon = collectionIcon

        locals.submissionCitations = submissionCitations
	locals.citationsSource = citations.map(function(citation) {
            return citation.citation
        }).join(',');

        locals.collections = collections

        locals.meta.description = locals.meta.description.split(';').join('<br/>')

        locals.meta.triplestore = graphUri ? 'private' : 'public'
        locals.meta.remote = remote

        //locals.meta.displayList = getDisplayList(moduleDefinition)

        res.send(pug.renderFile('templates/views/moduleDefinition.jade', locals))

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
