
import pug from 'pug';
import sparql from '../../sparql/sparql';
import db from '../../db';
import config from '../../config';

export default async function(req, res) {

    let users = await db.model.User.findAll()

    var locals = {
        config: config.get(),
        section: 'admin',
        adminSection: 'users',
        user: req.user,
        users: users,
        canSendEmail: config.get('mail').sendgridApiKey != ""
    }

    res.send(pug.renderFile('templates/views/admin/users.jade', locals))
};


