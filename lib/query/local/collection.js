
const loadTemplate = require('../../loadTemplate')
const sparql = require('../../sparql/sparql')
const config = require('../../config')
var escape = require('pg-escape')

async function getCollectionMemberCount(uri, graphUri, search) {

    const isSearch = (search !== '')

    var templateParams =  {
        collection: uri,
        search: search !== '' && search !== undefined ? escape(
				'FILTER(CONTAINS(lcase(?displayId), lcase(%L))||CONTAINS(lcase(?name), lcase(%L))||CONTAINS(lcase(?description), lcase(%L)))',
				search, search, search
			) : ''
    }

    var query = isSearch?
        loadTemplate('./sparql/CountMembersSearch.sparql', templateParams)
        : loadTemplate('./sparql/CountMembers.sparql', templateParams)

    console.log(query)

    let result = await sparql.queryJson(query, graphUri)

    if (result && result[0]) {
        console.log(result)

        return result[0].count

    } else {

        throw new Error('collection not found')

    }
}

async function getRootCollectionMetadata(graphUri) {

    var query = loadTemplate('./sparql/RootCollectionMetadata.sparql', {});

    let sparqlResults = await sparql.queryJson(query, graphUri)

    return sparqlResults.map(function (result) {
        return {
            uri: result['Collection'],
            name: result['name'] || '',
            description: result['description'] || '',
            displayId: result['displayId'] || '',
            version: result['version'] || ''
        };
    })
}

async function getContainingCollections(uri, graphUri, reqUrl) {

    function sortByNames(a, b) {
        if (a.name < b.name) {
            return -1
        } else {
            return 1
        }
    }

    var query =
        'PREFIX sbol2: <http://sbols.org/v2#>\n' +
        'PREFIX dcterms: <http://purl.org/dc/terms/>\n' +
        'SELECT ?subject ?displayId ?title WHERE {' +
        '   ?subject a sbol2:Collection .' +
        '   ?subject sbol2:member <' + uri + '> .' +
        '   OPTIONAL { ?subject sbol2:displayId ?displayId } .' +
        '   OPTIONAL { ?subject dcterms:title ?title } .' +
        '}'

    let results = await sparql.queryJson(query, graphUri)

    results = results.map((result) => {
        return {
            uri: result.subject,
            name: result.title ? result.title : result.displayId
        }
    })

    results.sort(sortByNames)
    
    return results
}

async function getCollectionMembers(uri, graphUri, limit, offset, sortColumn, search) {

    var graphs = ''
    var sort = ''
    if (graphUri) {
        graphs = 'FROM <' + config.get('triplestore').defaultGraph + '> FROM <' + graphUri + '>'
    }

    const isSearch = (search !== '')

    sort = ' ORDER BY ASC(lcase(str(?type))) ASC(str(lcase(?name))) '

    //sort = ' ORDER BY ASC(lcase(str(?type))) ASC(concat(str(lcase(?name)),str(lcase(?displayId)))) '

    if (sortColumn !== undefined && 
	sortColumn.dir !== undefined &&
	sortColumn.column !== undefined) {
	if (sortColumn.column == 'name') {
	    sort = ' ORDER BY ' + sortColumn.dir.toUpperCase() + 
		'(lcase(str(?name))) '
//		'(concat(str(lcase(?name)),str(lcase(?displayId)))) '
	} else if (sortColumn.column == 'type') {
	    sort = ' ORDER BY ' + sortColumn.dir.toUpperCase() + '(lcase(str(?type))) ' +
		'ASC(lcase(str(?name))) '
//		'ASC(concat(str(lcase(?name)),str(lcase(?displayId)))) '
	} else {
	    sort = ' ORDER BY ' + sortColumn.dir.toUpperCase() + '(lcase(str(?' + sortColumn.column + '))) '
	}
    }

    var templateParams = {
        graphs: graphs,
        collection: uri,
        offset: offset !== undefined ? ' OFFSET ' + offset : '',
        limit: limit !== undefined ? ' LIMIT ' + limit : '',
	//sort: sortColumn !== undefined && sortColumn.dir !== undefined && sortColumn.column !== undefined ? ' ORDER BY ' + sortColumn.dir.toUpperCase() + '(UCASE(str(?' + sortColumn.column + '))) ' : '',
        sort: sort,
        search: search !== '' && search !== undefined ? escape(
				'FILTER(CONTAINS(lcase(?displayId), lcase(%L))||CONTAINS(lcase(?name), lcase(%L))||CONTAINS(lcase(?description), lcase(%L)))',
				search, search, search
			) : ''
    }

    var query = isSearch?loadTemplate('sparql/getCollectionMembersSearch.sparql', templateParams):
	loadTemplate('sparql/getCollectionMembers.sparql', templateParams)

    console.log(query)

    let result = await sparql.queryJson(query, graphUri)

    if (result) {

        return result

    } else {

        throw new Error('collection not found')

    }
}

async function getSubCollections(uri, graphUri) {

    var query = loadTemplate('./sparql/SubCollectionMetadata.sparql', {

        parentCollection: sparql.escapeIRI(uri)

    })

    let sparqlResults = await sparql.queryJson(query, graphUri)

    return sparqlResults.map(function (result) {
        return {
            uri: result['Collection'],
            name: result['name'] || '',
            description: result['description'] || '',
            displayId: result['displayId'] || '',
            version: result['version'] || ''
        };
    });
}

async function getCollectionMetaData(uri, graphUri) {

    var templateParams = {
        collection: uri
    }

    var query = loadTemplate('sparql/getCollectionMetaData.sparql', templateParams)

    let result = await sparql.queryJson(query, graphUri)

    if (result && result[0]) {

        return result[0]

    } else {

        return null /* not found */

    }
}

module.exports = {
    getRootCollectionMetadata: getRootCollectionMetadata,
    getCollectionMetaData: getCollectionMetaData,
    getCollectionMemberCount: getCollectionMemberCount,
    getContainingCollections: getContainingCollections,
    getCollectionMembers: getCollectionMembers,
    getSubCollections: getSubCollections
}

