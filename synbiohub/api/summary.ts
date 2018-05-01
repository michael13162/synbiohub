import pug from 'pug';
import { fetchSBOLObjectRecursive } from '../fetch/fetch-sbol-object-recursive';
import sbolmeta from 'sbolmeta';
import config from '../config';
import getUrisFromReq from '../getUrisFromReq';

export default async function(req, res) {

    const { graphUri, uri, designId, share } = getUrisFromReq(req, res)
    
    let result = await fetchSBOLObjectRecursive(uri, graphUri)

    const sbol = result.sbol
    const componentDefinition = result.object

    res.status(200)
        .type('application/json')
        .send(sbol.serializeJSON({
                        'xmlns:synbiohub': 'http://synbiohub.org#',
                        'xmlns:sybio': 'http://www.sybio.ncl.ac.uk#',
                        'xmlns:rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
                        'xmlns:ncbi': 'http://www.ncbi.nlm.nih.gov#',
                        'xmlns:igem': 'http://synbiohub.org/terms/igem/',
                        'xmlns:genbank': 'http://www.ncbi.nlm.nih.gov/genbank/',
                        'xmlns:annot' : 'http://myannotation.org/',
                        'xmlns:igem': 'http://parts.igem.org/#',
                        'xmlns:pr' : 'http://partsregistry.org/',
                        'xmlns:grn' : 'urn:bbn.com:tasbe:grn/',
                        'xmlns:myapp' : 'http://www.myapp.org/',
                        'xmlns:sbolhub' : 'http://sbolhub.org/',
                        'xmlns:grn' : 'urn:bbn.com:tasbe:grn/'
        }))
};


