const config = require('../config')
const db = require('../db')
const util = require('../util')
const pug = require('pug')
const sha1 = require('sha1')

module.exports = function(req, res) {
    
    if(req.method == "POST") {
        post(req, res);
    }
}

function post(req, res) {
    groupId = req.body.group

    db.model.Membership.findAll({
        where: { 
            groupId: groupId
        }
    }).then(memberships => {
        return Promise.all(memberships.map(membership => {
            return membership.destroy()
        }))
    }).then(() => {
        return db.model.Group.findByPrimary(groupId).then(group => {
            group.destroy();
        }).then(() => {
            res.redirect('/groups');
        })
    })
}
