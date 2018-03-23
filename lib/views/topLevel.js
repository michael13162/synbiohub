let {getType} = require('../query/type');
let config = require('../config');
let collection = require('./collection');
let componentDefinition = require('./componentDefinition');
let moduleDefinition = require('./moduleDefinition');
let sequence = require('./sequence');
let model = require('./model');
let attachment = require('./attachment');
let genericTopLevel = require('./genericTopLevel');
let activity = require('./activity');
let agent = require('./agent');
let plan = require('./plan');
let implementation = require('./implementation');
let test = require('./test');
let pug = require('pug');
let getUrisFromReq = require('../getUrisFromReq');

module.exports = function(req, res) {
  const {graphUri, uri, designId} = getUrisFromReq(req, res);

  getType(uri, graphUri).then((result) => {
    if (result==='http://sbols.org/v2#Collection') {
      collection(req, res);
      return;
    } else if (result==='http://sbols.org/v2#ComponentDefinition') {
      componentDefinition(req, res);
      return;
    } else if (result==='http://sbols.org/v2#ModuleDefinition') {
      moduleDefinition(req, res);
      return;
    } else if (result==='http://sbols.org/v2#Sequence') {
      sequence(req, res);
      return;
    } else if (result==='http://sbols.org/v2#Model') {
      model(req, res);
      return;
    } else if (result==='http://www.w3.org/ns/prov#Activity') {
      activity(req, res);
      return;
    } else if (result==='http://www.w3.org/ns/prov#Agent') {
      agent(req, res);
      return;
    } else if (result==='http://www.w3.org/ns/prov#Plan') {
      plan(req, res);
      return;
    } else if (result==='http://wiki.synbiohub.org/wiki/Terms/synbiohub#Attachment') {
      attachment(req, res);
      return;
    } else if (result==='http://intbio.ncl.ac.uk#Implementation') {
      implementation(req, res);
      return;
    } else if (result==='http://intbio.ncl.ac.uk#Test') {
      test(req, res);
      return;
    } else {
      genericTopLevel(req, res);
      return;
    }
  }).catch((err) => {
    let locals = {
      config: config.get(),
      section: 'errors',
      user: req.user,
      errors: [err.stack],
    };
    res.send(pug.renderFile('templates/views/errors/errors.jade', locals));
  });
};


