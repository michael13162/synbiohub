
var pug = require('pug')

var sparql = require('../../sparql/sparql')

const config = require('../../config')

module.exports = async function(req, res) {

    const query = [
        'SELECT DISTINCT ?graph WHERE {',
            'GRAPH ?graph { ?s ?a ?t }',
        '}'
    ].join('\n')

    let results = await sparql.queryJson(query, null)

    const graphs = results.map((result) => result.graph)

    let graphs = await Promise.all(
        graphs.map((graph) => graphInfo(graph))
    )

    var locals = {
        config: config.get(),
        section: 'admin',
        adminSection: 'graphs',
        user: req.user,
        graphs: graphs
    }

    res.send(pug.renderFile('templates/views/admin/graphs.jade', locals))


    async function graphInfo(graphUri) {

        const countTriplesQuery =  [
            'SELECT (COUNT(*) as ?count) WHERE {',
                '?s ?p ?o .',
            '}'
        ].join('\n')

        let results = await sparql.queryJson(countTriplesQuery, graphUri)

        return {
            graphUri: graphUri,
            numTriples: results[0].count
        }
    }

};
