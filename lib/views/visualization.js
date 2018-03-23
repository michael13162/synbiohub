const {fetchSBOLObjectRecursive} = require('../fetch/fetch-sbol-object-recursive');
const pug = require('pug');
const getDisplayList = require('visbol/lib/getDisplayList');
const config = require('../config');
const getUrisFromReq = require('../getUrisFromReq');

module.exports = function(req, res) {
  let locals = {
    config: config.get(),
    section: 'component',
    user: req.user,
  };

  const {
    graphUri,
    uri,
    designId,
    share,
    url,
  } = getUrisFromReq(req, res);

  let templateParams = {
    uri: uri,
  };

  fetchSBOLObjectRecursive('ComponentDefinition', uri, graphUri).then((result) => {
    sbol = result.sbol;
    componentDefinition = result.object;

    return componentDefinition;
  }).then((componentDefinition) => {
    locals.meta = {
      displayList: getDisplayList(componentDefinition, config, req.url.toString().endsWith('/share')),
    };

    res.send(pug.renderFile('templates/views/visualization.jade', locals));
  }).catch((err) => {
    const locals = {
      config: config.get(),
      section: 'errors',
      user: req.user,
      errors: [err.stack],
    };

    res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
  });
};
