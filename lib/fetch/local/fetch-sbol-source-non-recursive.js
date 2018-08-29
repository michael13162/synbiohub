
var SBOLDocument = require('sboljs')

var sparql = require('../../sparql/sparql')

var config = require('../../config')

var resolveBatch = config.get('resolveBatch')

var databasePrefix = config.get('databasePrefix')

var request = require('request')

var async = require('async')

const fs = require('mz/fs')

const tmp = require('tmp-promise')

const serializeSBOL = require('../../serializeSBOL')

function fetchSBOLSourceNonRecursive(type, uri, graphUri) {

    const sbol = new SBOLDocument()
    
    sbol._resolving = {};
    sbol._rootUri = uri

    sbol.lookupURI(sbol._rootUri)

    return sparql.queryJson([
        'SELECT ?coll ?type WHERE {',
        '?coll a ?type .',
        'FILTER(?coll = <' + sbol._rootUri + '>)',
        '}'
    ].join('\n'), graphUri).then((results) => {

	if(results.length > 0) {
	    return getSBOLNonRecursive(sbol, type, uri, graphUri).then((res) => {

		return tmp.tmpName().then((tmpFilename) => {
		    
		    return fs.writeFile(tmpFilename, serializeSBOL(res.sbol))
			.then(() => Promise.resolve(tmpFilename))

		})

	    })

	} else {
	    
	    return Promise.reject(new Error(sbol._rootUri + ' not found'))

	}
	
    })
    
}

function getSBOLNonRecursive(sbol, type, uri, graphUri) {

    var complete = false;
    var resolved = false;

    var prefix = uri.substring(0, uri.lastIndexOf('/')+1)

    return new Promise((resolve, reject) => {

        async.series([

            function getLocalParts(next) {

                completePartialDocumentNR(prefix, graphUri, sbol, type, new Set([]), (err) => {

                    if(err) {
                        next(err)

                    } else {

                        if(!complete) {

                            complete = true

                            next()
                        }

                    }
                })
            }

        ], function done(err) {

            if (err) {

                reject(err)

            } else {

                resolve({
                    sbol: sbol,
                    object: sbol.lookupURI(sbol._rootUri)
                })
            }
        })

    })

}

function completePartialDocumentNR(prefix, graphUri, sbol, type, skip, next) {

    //console.log(sbol.unresolvedURIs.length + ' unresolved URI(s)')

    if(sbol.unresolvedURIs.length === 0) {

        next();

    } else {

        var toResolve = sbol.unresolvedURIs.filter((uri) => !sbol._resolving[uri] && uri.startsWith(prefix) &&
						   !skip.has(uri.toString()) && uri.toString().startsWith(databasePrefix))
                                .map((uri) => uri.toString())

        toResolve = toResolve.slice(0, resolveBatch)

        retrieveSBOL(graphUri, sbol, type, toResolve, (err) => {

            if(err) {
                next(err)
                return
            }

            var done = true

            // somehow we killed the optimiser by doing uri toString inside
            // the loop, so let's do it first...
            //
            // ~50 seconds -> instant, thanks v8
            //
            var uriStrings = sbol.unresolvedURIs.map((uri) => uri.toString())

            for(var i = 0; i < uriStrings.length; ++ i)
            {
                var uri = uriStrings[i]

                var uriString = uri

                if (toResolve.indexOf(uriString) === -1 && uriString.startsWith(prefix) && uriString.startsWith(databasePrefix) && !skip.has(uriString)) {
                    done = false
                } else {
                    skip.add(uriString)
                }
            }

            if (done) {
                next()
                return
            }

            completePartialDocumentNR(prefix, graphUri, sbol, type, skip, next)

        })
    }
}

function retrieveSBOL(graphUri, sbol, type, uris, next) {

    Object.assign(sbol._resolving, uris)

    var countQuery = sparqlDescribeSubjects(sbol, type, uris, true)

    var query = sparqlDescribeSubjects(sbol, type, uris, false)

    var offset = 0
    var limit = config.get('staggeredQueryLimit')
    var countLeft

    sparql.queryJson(countQuery, graphUri).then((res) => {

        //console.log('count is ' + res[0].count)

        countLeft = res[0].count

        // if(countLeft === 0) {

        //     console.log(countQuery)

        //     next(new Error('incomplete document?'))
        //     return

        // }

        var rdf = []

        return doQuery()

        function doQuery() {

            return sparql.query(query + ' OFFSET ' + offset + ' LIMIT ' + limit, graphUri, 'application/rdf+xml').then((res) => {

                countLeft -= limit
                offset += limit

                rdf.push(res.body)

                if(countLeft > 0) {

                    return doQuery()

                } else {

                    //console.log('loading rdf')

                    sbol.loadRDF(rdf, next)

                }

            }).catch((err) => {

                next(err)

            })
        }

    })


}

function sparqlDescribeSubjects(sbol, type, uris, isCount) {
 
   var query = [
       isCount ?
           'SELECT (count(?s) as ?count) WHERE {'
       :
           'CONSTRUCT { ?s ?p ?o } WHERE {'
   ]

   var isFirst = true

   uris.forEach((uri) => {

       if(isFirst)
           isFirst = false
       else
           query.push('UNION')

       query.push(
           '{',
           '?s ?p ?o .'
        )

       if(uri === sbol._rootUri) {
           if(type !== null) {
               if (type === "TopLevel") {
                   query.push('?s a ?t .')
                   // TODO: the generic top level will not work
                   query.push('FILTER(?t = <http://sbols.org/v2#ComponentDefinition>' + ' ||' +
                       ' ?t = <http://sbols.org/v2#ModuleDefinition>' + ' ||' +
                       ' ?t = <http://sbols.org/v2#Model>' + ' ||' +
                       ' ?t = <http://sbols.org/v2#Collection>' + ' ||' +
                       ' ?t = <http://sbols.org/v2#Sequence>' + ' ||' +
                       ' ?t = <http://sbols.org/v2#GenericTopLevel>)')
               } else if (type != 'GenericTopLevel') {
                   query.push('?s a <http://sbols.org/v2#' + type + '> .')
               }
           }
       }

        query.push(
           'FILTER(?s = ' + sparql.escapeIRI(uri) + ')',
           '}'
        )
   })

   query.push('}')

   return query.join('\n')
}

module.exports = {
    fetchSBOLSourceNonRecursive: fetchSBOLSourceNonRecursive
}



