
import sendMail from './sendMail';
import loadTemplate from '../loadTemplate';
import config from '../config';

function sendResetPasswordMail(user) {

    sendMail(user, 'Reset your password', loadTemplate('mail/resetPassword.txt', {

        link: config.get('instanceUrl') + 'resetPassword/token/' + user.resetPasswordLink

    }))

}

export default sendResetPasswordMail;

