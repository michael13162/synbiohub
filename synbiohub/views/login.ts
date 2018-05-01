
import pug from 'pug';
import extend from 'xtend';
import db from '../db';
import sha1 from 'sha1';
import config from '../config';
import apiTokens from '../apiTokens';

export default function (req, res) {

    if (req.method === 'POST') {

        loginPost(req, res)

    } else {

        loginForm(req, res, {})

    }
};

async function loginForm(req, res, locals) {

    if (req.user) {

        return res.redirect(req.query.next || '/');

    }

    locals = extend({
        config: config.get(),
        section: 'login',
        nextPage: req.query.next || '/',
        loginAlert: null,
        user: req.user,
        next: req.query.next || '',
        forgotPasswordEnabled: config.get("mail").sendgridApiKey != ""
    }, locals)

    res.send(pug.renderFile('templates/views/login.jade', locals))
}

async function loginPost(req, res) {

    if (!req.body.email || !req.body.password) {
        if (req.forceNoHTML || !req.accepts('text/html')) {
            res.status(401).type('text/plain').send('Please enter your e-mail address and password.')
            return
        } else {
            return loginForm(req, res, {
                form: req.body,
                loginAlert: 'Please enter your e-mail address and password.'
            })
        }

    }

    let user = await db.model.User.findOne({
        where: db.sequelize.or({ email: req.body.email }, { username: req.body.email })
    })

    var passwordHash = sha1(config.get('passwordSalt') + sha1(req.body.password))

    if (!user) {
        if (req.forceNoHTML || !req.accepts('text/html')) {
            res.status(401).type('text/plain').send('Your e-mail address was not recognized.')
            return
        } else {
            return loginForm(req, res, {
                form: req.body,
                loginAlert: 'Your e-mail address was not recognized.',
                next: req.body.next
            })
        }

    }

    if (passwordHash !== user.password) {
        if (req.forceNoHTML || !req.accepts('text/html')) {
            res.status(401).type('text/plain').send('Your password was not recognized.')
            return
        } else {
            return loginForm(req, res, {
                form: req.body,
                loginAlert: 'Your password was not recognized.',
                next: req.body.next
            })
        }
    }

    if (req.forceNoHTML || !req.accepts('text/html')) {
        res.status(200).type('text/plain').send(apiTokens.createToken(user))
    } else {
        req.session.user = user.id
        req.session.save(() => {
            res.redirect(req.body.next || '/');
        })
    }
}


