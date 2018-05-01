
import sparql from '../../sparql/sparql';
import assert from 'assert';

async function getType(uri, graphUri) {

    assert(!Array.isArray(graphUri))

    let result = await sparql.queryJson('SELECT ?type WHERE { <' + uri + '> a ?type }', graphUri)

    if (result && result[0]) {

        return result[0].type

    } else {

        throw new Error('getType: ' + uri + ' not found')

    }
}

export default {
    getType: getType
};

