const pug = require('pug');
const config = require('../../config');

module.exports = function(req, res) {
  const remotesConfig = config.get('remotes');

  const remotes = Object.keys(remotesConfig).map((id) => remotesConfig[id]);

  let locals = {
    config: config.get(),
    section: 'admin',
    adminSection: 'remotes',
    user: req.user,
    remotes: remotes,
    remoteTypes: ['ice', 'benchling'],
  };

  res.send(pug.renderFile('templates/views/admin/remotes.jade', locals));
};

