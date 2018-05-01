
import loadTemplate from '../../loadTemplate';
import sparql from '../../sparql/sparql';
import compareMavenVersions from '../../compareMavenVersions';

async function getVersion(uri, graphUri) {

    var query = loadTemplate('./sparql/GetVersions.sparql', {
        uri: uri
    })

    let results = await sparql.queryJson(query, graphUri)

    if(results && results[0]) {

        const sortedVersions = results.sort((a, b) => {

            return compareMavenVersions(a.version, b.version)

        }).reverse()

        return sortedVersions[0].version

    } else {

        throw new Error('not found')

    }
}

export default {
    getVersion: getVersion
};

