
import { getCollectionMembersRecursive } from '../query/collection';
import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import getGraphUriFromTopLevelUri from '../getGraphUriFromTopLevelUri';

async function fetchCollectionFASTA(collectionUri) {

    const graphUri = getGraphUriFromTopLevelUri(collectionUri, user)

    let members = await getCollectionMembersRecursive(collectionUri, graphUri)

    const flattenedMembers = []

    members.forEach(flattenMember)

    function flattenMember(member) {

        flattenedMembers.push(member)

        if(member.members !== undefined) {

            Array.prototype.push.apply(flattenedMembers, member.members)

            member.members.forEach(flattenMember)
        }
    }

    const sequences = flattenedMembers.filter((member) => {
        return member.type === 'http://sbols.org/v2#Sequence'
    })

    let sequenceResults = await Promise.all(
        sequences.map((sequence) => fetchSBOLObjectRecursive('Sequence', sequence.uri, graphUri))
    )

    //console.log('ress')
    //console.dir(sequenceResults)

    const sequences = sequenceResults.map((result) => result.object)
    //console.log('seqs')
    //console.log(JSON.stringify(sequences, null, 2))
    // wtf its all URIs
    // also _rootUri is set, looks like it hit the local thingy


    const fasta = []

    sequences.forEach((sequence) => {
        fasta.push('>' + sequence.name)
        fasta.push(sequence.elements)
    })

    return fasta.join('\n')
}

export default {
    fetchCollectionFASTA: fetchCollectionFASTA
};

