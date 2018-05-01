
import sparql from '../sparql/sparql';
import { Parser as SparqlParser } from 'sparqljs';
import { Generator as SparqlGenerator } from 'sparqljs';
import checkQuery from '../checkSparqlQuery';

export default function(req, res) {

    if(req.method === 'POST') {

        query(req, res, req.body.query, req.body['default-graph-uri'])

    } else if(req.method === 'GET') {

        query(req, res, req.query.query, req.query['default-graph-uri'])

    } else {
        throw new Error('???')
    }

};

async function query(req, res, rawQuery, graphUri) {

    graphUri = graphUri || null

    const parser = new SparqlParser()
    const generator = new SparqlGenerator()

    var query

    try {

        query = parser.parse(rawQuery)

    } catch(e) {
        res.status(500).send(e.stack)
        return
    }

    const queryString = generator.stringify(query)

    try {
        checkQuery(query, req.user)
    } catch(e) {
        res.status(500).send(e.stack)
        return
    }

    let result = await sparql.query(queryString, graphUri, req.header('accept'))

    const { type, statusCode, body } = result

    res.status(statusCode)
    res.header('content-type', type)
    res.send(body)
}



