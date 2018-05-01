
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
    var mail = config.get('mail')

	locals = extend({
        config: config.get(),
        section: 'admin',
        adminSection: 'theme',
        user: req.user,
        sendGridApiKey: mail.sendgridApiKey,
        sendGridFromEmail: mail.fromAddress
    }, locals);
	
    res.send(pug.renderFile('templates/views/admin/mail.jade', locals))
}

function post(req, res) {
    if(!req.body.key) {
        return form(req, res, {
            registerAlert: 'Please enter the SendGrid API Key'
        })
    }

    if(!req.body.fromEmail) {
        return form(req, res, {
            registerAlert: 'Please enter the SendGrid From email'
        })
    }

    var mail = {}
    mail.sendgridApiKey = req.body.key;
    mail.fromAddress = req.body.fromEmail;
    config.set('mail', mail)

    res.redirect('/admin/mail/');
}



