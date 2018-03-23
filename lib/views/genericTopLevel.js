const {fetchSBOLObjectRecursive} = require('../fetch/fetch-sbol-object-recursive');
const {getContainingCollections} = require('../query/local/collection');
let filterAnnotations = require('../filterAnnotations');
let retrieveCitations = require('../citations');
const shareImages = require('../shareImages');
let loadTemplate = require('../loadTemplate');
let sbolmeta = require('sbolmeta');
let pug = require('pug');
let sparql = require('../sparql/sparql-collate');
let wiky = require('../wiky/wiky.js');
let config = require('../config');
let URI = require('sboljs').URI;
let getUrisFromReq = require('../getUrisFromReq');
const attachments = require('../attachments');
const uriToUrl = require('../uriToUrl');
let sha1 = require('sha1');

module.exports = function(req, res) {
  let locals = {
    config: config.get(),
    section: 'component',
    user: req.user,
  };

  let meta;
  let sbol;
  let genericTopLevel;
  let collectionIcon;
  let remote;

  let collections = [];

  let submissionCitations = [];
  let citations = [];

  const {graphUri, uri, designId, share, url} = getUrisFromReq(req, res);

  let templateParams = {
    uri: uri,
  };

  let getCitationsQuery = loadTemplate('sparql/GetCitations.sparql', templateParams);

  fetchSBOLObjectRecursive(uri, graphUri).then((result) => {
    sbol = result.sbol;
    genericTopLevel = result.object;
    remote = result.remote;

    if (!genericTopLevel || genericTopLevel instanceof URI) {
      locals = {
        config: config.get(),
        section: 'errors',
        user: req.user,
        errors: [uri + ' Record Not Found: ' + genericTopLevel],
      };
      res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
      return Promise.reject();
    }
    meta = sbolmeta.summarizeGenericTopLevel(genericTopLevel);
    if (!meta) {
      locals = {
        config: config.get(),
        section: 'errors',
        user: req.user,
        errors: [uri + ' summarizeGenericTopLevel returned null'],
      };
      res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
      return Promise.reject();
    }
  }).then(function lookupCollections() {
    return Promise.all([
      getContainingCollections(uri, graphUri, req.url).then((_collections) => {
        collections = _collections;

        collections.forEach((collection) => {
          collection.url = uriToUrl(collection.uri);

          const collectionIcons = config.get('collectionIcons');

          if (collectionIcons[collection.uri]) {
            collectionIcon = collectionIcons[collection.uri];
          }
        });
      }),

      sparql.queryJson(getCitationsQuery, graphUri).then((results) => {
        citations = results;
      }).then(() => {
        return retrieveCitations(citations).then((resolvedCitations) => {
          submissionCitations = resolvedCitations;

          // console.log('got citations ' + JSON.stringify(submissionCitations));
        });
      }),

    ]);
  }).then(function renderView() {
    if (meta.description != '') {
      meta.description = wiky.process(meta.description, {});
    }

    meta.mutableDescriptionSource = meta.mutableDescription.toString() || '';
    if (meta.mutableDescription.toString() != '') {
      meta.mutableDescription = shareImages(req, meta.mutableDescription.toString());
      meta.mutableDescription = wiky.process(meta.mutableDescription.toString(), {});
    }

    meta.mutableNotesSource = meta.mutableNotes.toString() || '';
    if (meta.mutableNotes.toString() != '') {
      meta.mutableNotes = shareImages(req, meta.mutableNotes.toString());
      meta.mutableNotes = wiky.process(meta.mutableNotes.toString(), {});
    }

    meta.sourceSource = meta.source.toString() || '';
    if (meta.source.toString() != '') {
      meta.source = shareImages(req, meta.source.toString());
      meta.source = wiky.process(meta.source.toString(), {});
    }

    meta.attachments = attachments.getAttachmentsFromTopLevel(sbol, genericTopLevel,
      req.url.toString().endsWith('/share'));

    locals.canEdit = false;

    if (!remote && req.user) {
      const ownedBy = genericTopLevel.getAnnotations('http://wiki.synbiohub.org/wiki/Terms/synbiohub#ownedBy');
      const userUri = config.get('databasePrefix') + 'user/' + req.user.username;

      if (ownedBy && ownedBy.indexOf(userUri) > -1) {
        locals.canEdit = true;
      }
    }

    meta.url = '/' + meta.uri.toString().replace(config.get('databasePrefix'), '');
    if (req.url.toString().endsWith('/share')) {
      meta.url += '/' + sha1('synbiohub_' + sha1(meta.uri) + config.get('shareLinkSalt')) + '/share';
    }

    if (genericTopLevel.wasGeneratedBy) {
      meta.wasGeneratedBy = {uri: genericTopLevel.wasGeneratedBy.uri?genericTopLevel.wasGeneratedBy.uri:genericTopLevel.wasGeneratedBy,
        url: uriToUrl(genericTopLevel.wasGeneratedBy, req),
      };
    }

    locals.meta = meta;

    locals.meta.triplestore = graphUri ? 'private' : 'public';
    locals.meta.remote = remote;

    locals.rdfType = {
      name: genericTopLevel.rdfType?genericTopLevel.rdfType.slice(genericTopLevel.rdfType.lastIndexOf('/')+1):'unknown',
      url: genericTopLevel.rdfType,
    };

    locals.annotations = filterAnnotations(req, genericTopLevel.annotations);

    locals.share = share;
    locals.sbolUrl = url + '/' + meta.id + '.xml';
    if (req.params.userId) {
      locals.searchUsesUrl = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/uses';
      locals.makePublic = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/makePublic';
      locals.remove = '/user/' + encodeURIComponent(req.params.userId) + '/' + designId + '/remove';
    } else {
      locals.searchUsesUrl = '/public/' + designId + '/uses';
      locals.remove = '/public/' + designId + '/remove';
    }

    locals.keywords = [];
    locals.citations = [];
    locals.prefix = req.params.prefix;

    locals.collections = collections;

    locals.collectionIcon = collectionIcon;

    locals.submissionCitations = submissionCitations;
    locals.citationsSource = citations.map(function(citation) {
      return citation.citation;
    }).join(',');

    locals.meta.description = locals.meta.description.split(';').join('<br/>');

    res.send(pug.renderFile('templates/views/genericTopLevel.jade', locals));
  }).catch((err) => {
    locals = {
      config: config.get(),
      section: 'errors',
      user: req.user,
      errors: [err.stack],
    };
    res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
  });
};

function listNamespaces(xmlAttribs) {
  let namespaces = [];

  Object.keys(xmlAttribs).forEach(function(attrib) {
    let tokens = attrib.split(':');

    if (tokens[0] === 'xmlns') {
      namespaces.push({
        prefix: tokens[1],
        uri: xmlAttribs[attrib],
      });
    }
  });

  return namespaces;
}


