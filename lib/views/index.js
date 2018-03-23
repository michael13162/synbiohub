
let pug = require('pug');

let config = require('../config');

module.exports = function(req, res) {
let locals = {
config: config.get(),
section: 'index',
user: req.user,
metaDesc: 'A parts repository for synthetic biology.',
};
res.send(pug.renderFile('templates/views/index.jade', locals));
};


