const config = require('../config')
const db = require('../db')
const pug = require('pug')

module.exports = function (req, res) {
    display(req, res);
}

function display(req, res) {

    req.user.getGroups().then(groups => {

        Promise.all([db.model.User.findAll(), Promise.all(groups.map(group => {
                return group.getUsers().then(groupUsers => {
                    return {
                        name: group.name,
                        description: group.description,
                        users: groupUsers 
                    }
                })
            }))
        ]).then(data => {
            let groups = data[1];
            let users = data[0];

            console.log(groups)
            console.log(users)

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