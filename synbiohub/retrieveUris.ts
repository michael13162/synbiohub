import sparql from './sparql/sparql';
import loadTemplate from './loadTemplate';
import config from './config';
import getGraphUriFromTopLevelUri from './getGraphUriFromTopLevelUri';

export default function(rootUri, graphUri) {

    let batchSize = config.get('resolveBatch');
    let resolved = [rootUri];
    let pending = [rootUri];

    return doNextQuery();

    function doNextQuery() {

        let resolveCount = pending.length >= batchSize ? batchSize : pending.length;

        let toResolve = pending.slice(0, resolveCount);
        pending = pending.slice(resolveCount);

        let uriFragment = toResolve.map(uri => {
            return '{ <' + uri + '> ?p ?object }';
        }).join(' UNION \n') + ' . ';

        let data = {
            uriFragments: uriFragment
        };

        let query = loadTemplate('sparql/FetchRelatedURIs.sparql', data);

        return sparql.queryJson(query, graphUri).then(results => {

            results.forEach(result => {
               let object = result["object"];

               if(object.indexOf(graphUri) !== -1 && resolved.indexOf(object) == -1 && object != graphUri) {
                    resolved.push(object);
                    pending.push(object);
               }
            });

            if(pending.length > 0) {
                return doNextQuery();
            } else {
                return resolved;
            }

        });
    }
};
