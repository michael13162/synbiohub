import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import { getComponentDefinitionMetadata } from '../query/component-definition';
import { getContainingCollections } from '../query/local/collection';
import loadTemplate from '../loadTemplate';
import sbolmeta from 'sbolmeta';
import async from 'async';
import prefixify from '../prefixify';
import pug from 'pug';
import sparql from '../sparql/sparql-collate';
import getDisplayList from 'visbol/lib/getDisplayList';
import config from '../config';
import striptags from 'striptags';
import { URI } from 'sboljs';
import getUrisFromReq from '../getUrisFromReq';

export default function (req, res) {

    var locals = {
        config: config.get(),
        section: 'component',
        user: req.user
    }

    const {
        graphUri,
        uri,
        designId,
        share,
        url
    } = getUrisFromReq(req, res)

    var templateParams = {
        uri: uri
    }

    fetchSBOLObjectRecursive('ComponentDefinition', uri, graphUri).then((result) => {

        sbol = result.sbol
        componentDefinition = result.object

        return componentDefinition;

    }).then(componentDefinition => {

        locals.meta = {
            displayList: getDisplayList(componentDefinition, config, req.url.toString().endsWith('/share'))
        }

        res.send(pug.renderFile('templates/views/visualization.jade', locals))

    }).catch((err) => {

        const locals = {
            config: config.get(),
            section: 'errors',
            user: req.user,
            errors: [err.stack]
        }

        res.send(pug.renderFile('templates/views/errors/errors.jade', locals))

    })

};
