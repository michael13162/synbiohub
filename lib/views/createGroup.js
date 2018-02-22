const config = require('../config')
const db = require('../db')
const pug = require('pug')
const sha1 = require('sha1')

module.exports = function(req, res) {
    
    if(req.method == "POST") {
        post(req, res);
    } else {
        form(req, res);
    }
}

function post(req, res) {
    if(!req.body.name || req.body.name === "")
        res.redirect('/groups') // TODO: make this actually an error
    else
        name = req.body.name

    if(!req.body.description)
        description = ""
    else
        description = req.body.description

    db.model.Group.create({
        name: name,
        description: description
    }).then(group => {
        group.addUser(req.user);
    }).then(() => {
        res.redirect('/groups');
    })
}


function form(req, res) {

    const locals = {
        config: config.get(),
        user: req.user
    }

    res.send(pug.renderFile('templates/views/createGroup.jade', locals))    
}