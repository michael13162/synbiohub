const pug = require('pug');
const search = require('../search');
const config = require('../config');
const loadTemplate = require('../loadTemplate');
const sparql = require('../sparql/sparql');
const { getRootCollectionMetadata } = require('../query/collection');
const uriToUrl = require('../uriToUrl');

module.exports = async function (req, res) {

    let collections = await getRootCollectionMetadata(null, req.user)

    const collectionIcons = config.get('collectionIcons');

    for(let collection of collections) {

        console.log(config.get('databasePrefix') + collection.uri);

        collection.url = uriToUrl(collection.uri);

        if (req.url.endsWith('/share')) {
            url += '/' + sha1('synbiohub_' + sha1(collection.uri) + config.get('shareLinkSalt')) + '/share';
        };

        collection.icon = collectionIcons[collection.uri];

        const remoteConfig = config.get('remotes')[collection.displayId.replace('_collection', '')]
        if (!remoteConfig || (remoteConfig && remoteConfig.public && collection.version === 'current')) {
            collection.public = true
        } else {
            collection.public = false
        }

    }

    var locals = {
        config: config.get(),
        section: 'browse',
        title: 'Browse Parts and Designs ‒ ' + config.get('instanceName'),
        metaDesc: 'Browse ' + collections.length + ' collection(s) including ' + collections.map((collection) => collection.name).join(', '),
        user: req.user,
        collections: collections
    };

    res.send(pug.renderFile('templates/views/browse.jade', locals));

}