
const pug = require('pug')

const sparql = require('../../sparql/sparql')

const db = require('../../db')

const config = require('../../config')

module.exports = async function(req, res) {

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


