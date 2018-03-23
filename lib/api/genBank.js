let pug = require('pug');

const {fetchSBOLObjectRecursive} = require('../fetch/fetch-sbol-object-recursive');

let sbolmeta = require('sbolmeta');

let serializeSBOL = require('../serializeSBOL');

let request = require('request');

let SBOLDocument = require('sboljs');

let config = require('../config');

let getUrisFromReq = require('../getUrisFromReq');

const convertToGenBank = require('../conversion/convert-to-genbank');

const tmp = require('tmp-promise');

let fs = require('mz/fs');

module.exports = function(req, res) {
  const {graphUri, uri, designId, share} = getUrisFromReq(req, res);

  let sbol;
  let componentDefinition;

  function saveTempFile() {
    return tmp.tmpName().then((tmpFilename) => {
      return fs.writeFile(tmpFilename, serializeSBOL(sbol)).then(() => {
        return Promise.resolve(tmpFilename);
      });
    });
  }

  fetchSBOLObjectRecursive(uri, graphUri).then((result) => {
    sbol = result.sbol;
    componentDefinition = result.object;

    console.log('-- converting to genbank');

    return saveTempFile().then((tmpFilename) => {
      return convertToGenBank(tmpFilename, {

      }).then((result) => {
        const {success, log, errorLog, resultFilename} = result;

        if (!success) {
          const locals = {
            config: config.get(),
            section: 'invalid',
            user: req.user,
            errors: [errorLog],
          };

          return fs.unlink(tmpFilename).then(() => {
            res.send(pug.renderFile('templates/views/errors/invalid.jade', locals));
          });
          return;
        } else {
          return fs.unlink(tmpFilename).then(() => {
            res.header('content-type', 'text/plain').send(log);
          });
		    // res.header('content-type', 'text/plain').send(log);
        }
      });
    });
  }).catch((err) => {
    const locals = {
      config: config.get(),
      section: 'errors',
      user: req.user,
      errors: [uri + ' Not Found'],
    };

    res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
  });
};

