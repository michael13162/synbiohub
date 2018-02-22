const config = require('../config')
const db = require('../db')

module.exports = function(req, res) {
    
    if(req.method == "POST") {
        post(req, res);
    } 
}

function post(req, res) {
    userId = req.body.user
    groupId = req.body.group

    return Promise.all([db.model.Group.findByPrimary(groupId), db.model.User.findById(userId)]).then(info => {
        var group = info[0]
        var user = info[1]

        return group.removeUser(user)
    }).then(() => {
        res.redirect('/groups')
    })
}