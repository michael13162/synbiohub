
const request = require('request-promise')
const config = require('../../../config')

function fetchSBOLObjectRecursive(remoteConfig, sbol, type, uri) {

    let body = await request({
        method: 'get',
        url: remoteConfig.url + '/' + uri.slice(config.get('databasePrefix').length) + '/sbol'
    })

    return await new Promise((resolve, reject) => {

        sbol.loadRDF(body, (err) => {

            if(err) {
                reject(err)
                return
            }

            const newURIs = {}

            Object.keys(sbol._URIs).forEach((uri) => {
                const obj = sbol.lookupURI(uri.toString())
                obj.persistentIdentity =
                    obj.persistentIdentity.toString().replace(remoteConfig.url + '/', config.get('databasePrefix'))
                obj.uri = obj.persistentIdentity + '/' + obj.version
                newURIs[obj.uri] = obj
            })

            sbol._URIs = newURIs

            const object = sbol.lookupURI(uri)

            resolve({
                sbol: sbol,
                object: object
            })

        })


    })
}

module.exports = {
    fetchSBOLObjectRecursive: fetchSBOLObjectRecursive
}

