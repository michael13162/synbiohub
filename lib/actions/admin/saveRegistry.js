const config = require('../../config');

module.exports = function(req, res) {
  let registries = config.get('webOfRegistries');

  registries[req.body.uri] = req.body.url;

  config.set('webOfRegistries', registries);

  res.redirect('/admin/registries');
};
