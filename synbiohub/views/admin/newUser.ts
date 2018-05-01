
import pug from 'pug';
import config from '../../config';
import createUser from '../../createUser';
import sendCreatePasswordMail from '../../mail/createPassword';
import extend from 'xtend';
import uuidV4 from 'uuid/v4';
import sha1 from 'sha1';

export default function(req, res) {
    if(req.method === 'POST') {
        post(req, res)
    } else {
        form(req, res, {})
    }
};


function form(req, res, locals) {

	locals = extend({
        config: config.get(),
        section: 'admin',
        adminSection: 'theme',
        user: req.user,
        form: locals.form || {}
    }, locals);
	
    res.send(pug.renderFile('templates/views/admin/newUser.jade', locals))
}

async function post(req, res) {
    if(!req.body.name) {
        return form(req, res, {
            form: req.body,
            registerAlert: 'Please enter the user\'s name'
        })
    }

    if(!req.body.email) {
        return form(req, res, {
            form: req.body,
            registerAlert: 'Please enter the user\'s email'
        })
    }

    if(!req.body.username) {
        return form(req,res, {
            form: req.body,
            registerAlert: 'Please enter the desired username'
        })
    }

    let user = await createUser({
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        affiliation: req.body.affiliation,
        password: uuidV4(),
        isAdmin: req.body.isAdmin !== undefined,
        isCurator: req.body.isCurator !== undefined,
        isMember: req.body.isMember !== undefined
    })

    user.resetPasswordLink = sha1(uuidV4())

    await user.save()

    sendCreatePasswordMail(user, req.user)

    res.redirect('/admin/users/');
}



