
import sparql from './sparql';
import retrieveCitations from '../citations';

export default async function getCitationsForSubject(subject, graphUri) {

    var getCitationsQuery =
        'PREFIX sbol2: <http://sbols.org/v2#>\n' +
        'PREFIX purl: <http://purl.obolibrary.org/obo/>\n' +
        'SELECT\n' +
        '    ?citation\n' +
        'WHERE {\n' +
        '    <' + subject + '> purl:OBI_0001617 ?citation\n' +
        '}\n'

    let citations = await sparql.queryJson(getCitationsQuery, graphUri)

    let submissionCitations = await retrieveCitations(citations)

    return submissionCitations
}


