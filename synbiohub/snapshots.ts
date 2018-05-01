
import sparql from './sparql/sparql';
import loadTemplate from './loadTemplate';

function getSnapshots(uri) {

    const query = loadTemplate('./sparql/GetSnapshots.sparql', {
        uri: uri
    })

    return sparql.queryJson(query, null).then((results) => {

        return Promise.resolve(results)

    })



}

export default {
    getSnapshots: getSnapshots
};

