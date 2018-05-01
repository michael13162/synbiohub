
import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import sbolmeta from 'sbolmeta';
import async from 'async';
import pug from 'pug';
import sparql from '../sparql/sparql-collate';
import wiky from '../wiky/wiky.js';
import config from '../config';
import { URI } from 'sboljs';
import getUrisFromReq from '../getUrisFromReq';
import tasks from '../task/index';
import jobUtils from '../jobs/job-utils';

export default function(req, res) {

    if(req.method === 'POST') {

        handlePost(req, res)

    } else {

        handleGet(req, res)

    }

};

async function handleGet(req, res) {

    const { graphUri, uri, designId } = getUrisFromReq(req, res)

    let result = await fetchSBOLObjectRecursive(uri, graphUri)

    console.log('res is ' + result)
    console.log('r2 is ' + result.sbol)
    console.log('graph uri is ' + result.graphUri)

    const locals = {
        config: config.get(),
        section: 'dataIntegration',
        user: req.user,
        graphUri: result.graphUri,
        inputUri: uri,
        tasks: tasks
    }

    res.send(pug.renderFile('templates/views/dataIntegration.jade', locals))
}


async function handlePost(req, res) {

    const graphUri = req.body.graphUri
    const inputUri = req.body.inputUri
    const tasks = JSON.parse(req.body.tasks)

    if(graphUri !== config.get('triplestore').defaultGraph &&
            graphUri !== req.user.graphUri) {

        res.status(403).send('bad graph uri')
        return

    }

    let job = await jobUtils.createJob(req.user, graphUri, inputUri, tasks)

    res.redirect('/jobs')

}



