
let {getVersion} = require('../query/version');

let async = require('async');

let config = require('../config');

let pug = require('pug');

let getUrisFromReq = require('../getUrisFromReq');

let topLevel = require('./topLevel');

module.exports = function(req, res) {
  const {graphUri, uri, designId, url} = getUrisFromReq(req, res);

  getVersion(uri, graphUri).then((result) => {
    res.redirect(url + '/' + result);
  }).catch((err) => {
    topLevel(req, res);
  });
};


