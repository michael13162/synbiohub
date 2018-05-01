const config = require('../config')
const request = require('request-promise')

const shell = require('shelljs')

const fs = require('mz/fs')

const sparqlResultsToArray = require('./sparql-results-to-array')

//const Timer = require('../util/execution-timer')

const spawn = require('child_process').spawn

const tmp = require('tmp-promise')

var exec = require('child_process').exec;

function escapeSparqlIRI(uri) {

    return '<' + uri + '>';

}

async function updateQuery(sparql, graphUri, accept) {

    const triplestoreConfig = config.get('triplestore')

    graphUri = graphUri || triplestoreConfig.defaultGraph

    if (config.get('logSparqlQueries'))
        console.log(sparql)

    let body = await request({

        method: 'POST',
        url: triplestoreConfig.sparqlEndpoint + '-auth',
        qs: {
            query: sparql,
            'default-graph-uri': graphUri
        },
        auth: {
            user: triplestoreConfig.username,
            pass: triplestoreConfig.password,
            sendImmediately: false
        },
        headers: {
            accept: accept
        }

    })

    return {
        type: res.headers['content-type'],
        statusCode: res.statusCode,
        body: body
    }
}

function updateQueryJson(sparql, graphUri) {

    //const timer = Timer('sparql query')

    let result = await updateQuery(sparql, graphUri, 'application/sparql-results+json')

    return parseResult(result)

    function parseResult(res) {

        //timer()

        //console.log('res status code is ' + res.statusCode)

        var results = JSON.parse(res.body)

        return sparqlResultsToArray(results)

    }


}

async function query(sparql, graphUri, accept) {

    const triplestoreConfig = config.get('triplestore')

    graphUri = graphUri || triplestoreConfig.defaultGraph

    if (config.get('logSparqlQueries'))
        console.log(sparql)

    let body = await request({

        method: 'get',
        url: triplestoreConfig.sparqlEndpoint,
        qs: {
            query: sparql,
            'default-graph-uri': graphUri
        },
        headers: {
            accept: accept
        }

    })

    return {
        type: res.headers['content-type'],
        statusCode: res.statusCode,
        body: body
    }
}

function queryJson(sparql, graphUri) {

    //const timer = Timer('sparql query')

    let result = await query(sparql, graphUri, 'application/sparql-results+json')

    return parseResult(result)

    function parseResult(res) {

        //timer()

        //console.log('res status code is ' + res.statusCode)

        var results = JSON.parse(res.body)
        
        return sparqlResultsToArray(results)

    }


}

async function queryJsonStaggered(sparql, graphUri) {

    var offset = 0
    var limit = config.get('staggeredQueryLimit')

    var resultsUnion = []

    return await performQuery()


    async function performQuery() {

        console.log('queryJsonStaggered: offset ' + offset + ', limit ' + limit + ', ' + resultsUnion.length + ' results so far')

        let results = await queryJson(sparql + ' OFFSET ' + offset + ' LIMIT ' + limit, graphUri)

        //console.log('qj results')
        //console.log(JSON.stringify(results))

        if (results.length === 0) {

            return resultsUnion

        } else {

            Array.prototype.push.apply(resultsUnion, results)

            offset += limit

            return await performQuery()

        }

    }
}

function deleteStaggered(sparql, graphUri) {

    var limit = config.get('staggeredQueryLimit')

    return await performQuery()

    async function performQuery() {

        console.log('deleteStaggered: limit ' + limit)

        let results = await updateQueryJson(sparql + ' LIMIT ' + limit, graphUri)

        // hacks! delete succeeds even if nothing was deleted, but it
        // does give us a nice message.
        //
        if (results[0]['callret-0'].indexOf('nothing to do') !== -1) {

            return undefined

        } else {

            return await performQuery()

        }
    }
}

async function upload(graphUri, data, type) {

    const triplestoreConfig = config.get('triplestore')

    graphUri = graphUri || triplestoreConfig.defaultGraph

    let body = await request({

        method: 'POST',
        url: triplestoreConfig.graphStoreEndpoint,
        qs: {
            'graph-uri': graphUri,
        },
        auth: {
            user: triplestoreConfig.username,
            pass: triplestoreConfig.password,
            sendImmediately: false
        },
        headers: {
            'content-type': type
        },
        body: data

    })

    return body
}

async function uploadSmallFile(graphUri, filename, type) {

    const triplestoreConfig = config.get('triplestore')

    graphUri = graphUri || triplestoreConfig.defaultGraph

    console.log('sparql upload file: ' + filename)
    console.log('gui ' + graphUri)

    /* TODO: it would be very nice to stream the file to the request
        * instead of loading it all into memory.
        * unfortunately, with auth: { sendImmediately: false }, the file gets
        * streamed to the initial request (which will fail), and then when the
        * retry request with authentication happens requestjs sends content
        * length of 0.
        */
    let contents = await fs.readFile(filename)

    let body = await request({

        method: 'POST',
        url: triplestoreConfig.graphStoreEndpoint,
        qs: {
            'graph-uri': graphUri,
        },
        auth: {
            user: triplestoreConfig.username,
            pass: triplestoreConfig.password,
            sendImmediately: false
        },
        headers: {
            'content-type': type
        },
        body: contents

    })

    console.log('uploadfile done; ' + res.statusCode)
    console.log(body)

    return body
}

function uploadFile(graphUri, filename, type) {

    let tempDir = await tmp.dir()

    console.log('file before splitting ' + filename)
    console.log('splitting RDF to n3 in temp dir ' + tempDir.path)

    await new Promise((resolve, reject) => {

        const splitProcess = spawn(__dirname + '/../../scripts/split_to_n3.sh', [
            filename
        ], {
            cwd: tempDir.path
        })

        splitProcess.stderr.on('data', (data) => {

            console.log('[split_to_n3.sh]', data.toString())

        })

        splitProcess.on('close', (exitCode) => {

            if (exitCode !== 0) {
                reject(new Error('split_to_n3 returned exit code ' + exitCode))
                return
            }

            resolve(tempDir.path)

        })

    })

    let files = await fs.readdir(tempDir)

    var filesToUpload = files.filter(
        (filename) => filename.indexOf('upload_') === 0)

    var total = filesToUpload.length

    console.log(filesToUpload + ' chunks to upload')

    return await uploadNextFile()

    async function uploadNextFile() {

        if (filesToUpload.length > 0) {

            var nextFile = tempDir + '/' + filesToUpload[0]
            filesToUpload = filesToUpload.slice(1)

            console.log('Uploading n3 chunk: ' + nextFile)

            await uploadSmallFile(graphUri, nextFile, 'text/n3')
            await fs.unlink(nextFile)
            await uploadNextFile()

        } else {
            return exec('rm -r ' + tempDir);
        }

    }
}

module.exports = {

    escape: require('pg-escape'),
    escapeIRI: escapeSparqlIRI,
    updateQuery: updateQuery,
    updateQueryJson: updateQueryJson,
    query: query,
    queryJson: queryJson,
    queryJsonStaggered: queryJsonStaggered,
    deleteStaggered: deleteStaggered,
    upload: upload,
    uploadFile: uploadFile,
}
