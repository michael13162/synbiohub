
import pug from 'pug';
import config from '../config';

export default function(req, res) {

	var locals = {
        config: config.get(),
        section: 'index',
        user: req.user,
        metaDesc: 'A parts repository for synthetic biology.'
    }
    res.send(pug.renderFile('templates/views/index.jade', locals))
};


