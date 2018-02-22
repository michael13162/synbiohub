const config = require('../config')
const db = require('../db')
const pug = require('pug')

module.exports = function (req, res) {
    display(req, res);
}

function display(req, res) {

    req.user.getGroups().then(groups => {

        db.model.User.findAll().then(users => {

            groups = groups.map(group => {

                let groupUsers = []

                return {
                    name: group.name,
                    description: group.description,
                    users: groupUsers 
                }
            })            

            let locals = {
                config: config.get(),
                user: req.user,
                users: users,
                groups: groups,
            }

            res.send(pug.renderFile('templates/views/groups.jade', locals))
        })
    })
}