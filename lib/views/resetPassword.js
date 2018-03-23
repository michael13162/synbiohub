
let pug = require('pug');
let validator = require('validator');
let util = require('../util');
let async = require('async');
let extend = require('xtend');
let config = require('../config');
let db = require('../db');

let sha1 = require('sha1');
let uuid = require('uuid');

let sendResetPasswordMail = require('../mail/resetPassword');

module.exports = function(req, res) {
if (req.method === 'POST') {
resetPasswordPost(req, res);
} else {
resetPasswordForm(req, res, {});
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
user: req.user,
}, locals);

res.send(pug.renderFile('templates/views/resetPassword.jade', locals));
}


function resetPasswordPost(req, res) {
if (!req.body.email || !validator.isEmail(req.body.email)) {
return resetPasswordForm(req, res, {
form: req.body,
resetPasswordAlert: 'Please enter a valid e-mail address',
});
}

let locals = {
config: config.get(),
section: 'resetPasswordDone',
user: req.user,
};

db.model.User.findOne({where: {email: req.body.email}}).then((user) => {
user.resetPasswordLink = sha1(uuid.v4());

return user.save();
}).then((user) => {
sendResetPasswordMail(user);

res.send(pug.renderFile('templates/views/resetPasswordDone.jade', locals));
}).catch((err) => {
res.send(pug.renderFile('templates/views/resetPasswordDone.jade', locals));
});
}

