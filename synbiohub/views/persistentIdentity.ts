
import { getVersion } from '../query/version';
import async from 'async';
import config from '../config';
import pug from 'pug';
import getUrisFromReq from '../getUrisFromReq';
import topLevel from './topLevel';

export default function(req, res) {

    const { graphUri, uri, designId, url } = getUrisFromReq(req, res)

    getVersion(uri, graphUri).then((result) => {
	
	res.redirect(url + '/' + result)

    }).catch((err) => {

	topLevel(req, res)
        
    })
	
};


