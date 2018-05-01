
import pug from 'pug';
import validator from 'validator';
import util from '../util';
import async from 'async';
import extend from 'xtend';
import config from '../config';
import db from '../db';
import sha1 from 'sha1';
import uuid from 'uuid';
import sendResetPasswordMail from '../mail/resetPassword';

export default function(req, res) {
    
    if(req.method === 'POST') {

        resetPasswordPost(req, res)

    } else {

        resetPasswordForm(req, res, {})

    }
    
};

function resetPasswordForm(req, res, locals) {

	if (req.user) {

		return res.redirect(req.query.next || '/');

	}

    locals = extend({
        config: config.get(),
        section: 'resetPassword',
        nextPage: req.query.next || '/',
        resetPasswordAlert: null,
        user: req.user
    }, locals)
    
    res.send(pug.renderFile('templates/views/resetPassword.jade', locals))
}


async function resetPasswordPost(req, res) {

    if(!req.body.email || !validator.isEmail(req.body.email)) {
        return resetPasswordForm(req, res, {
            form: req.body,
            resetPasswordAlert: 'Please enter a valid e-mail address'
        })
    }

    var locals = {
        config: config.get(),
        section: 'resetPasswordDone',
        user: req.user
    }

    let user = await db.model.User.findOne({ where: { email: req.body.email } })

    user.resetPasswordLink = sha1(uuid.v4())

    await user.save()

    sendResetPasswordMail(user)

    res.send(pug.renderFile('templates/views/resetPasswordDone.jade', locals))
}

