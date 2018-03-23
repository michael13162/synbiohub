let pug = require('pug');

const {fetchSBOLObjectRecursive} = require('../fetch/fetch-sbol-object-recursive');

let sbolmeta = require('sbolmeta');

let config = require('../config');

let getUrisFromReq = require('../getUrisFromReq');

module.exports = function(req, res) {
  const {graphUri, uri, designId, share} = getUrisFromReq(req, res);

  fetchSBOLObjectRecursive(uri, graphUri).then((result) => {
    const sbol = result.sbol;
    const sequence = result.object;

    let meta = sbolmeta.summarizeSequence(sequence);

    let lines = [];
    let charsPerLine = 70;

    lines.push('>' + meta.name
            + ' (' + meta.length + ' ' + meta.lengthUnits + ')');

    for (let i = 0; i < meta.length; ) {
      lines.push(meta.elements.substr(i, charsPerLine));
      i += charsPerLine;
    }

    let fasta = lines.join('\n');

    res.header('content-type', 'text/plain').send(fasta);
  }).catch((err) => {
    const locals = {
      config: config.get(),
      section: 'errors',
      user: req.user,
      errors: [err],
    };

    res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
  });
};


