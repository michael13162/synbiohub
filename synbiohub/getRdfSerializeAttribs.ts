

import config from './config';

function getRdfSerializeAttribs() {

    const prefixes = config.get('prefixes')

    const attribs = {}

    Object.keys(prefixes).forEach((prefix) => {

        attribs['xmlns:' + prefix] = prefixes[prefix]

    })

    return attribs

}

export default getRdfSerializeAttribs;


