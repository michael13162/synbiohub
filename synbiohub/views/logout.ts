
import pug from 'pug';

export default function (req, res) {

    if (req.session.user !== undefined)
        delete req.session.user

    req.session.save(() => {
        res.redirect('/');
    })

};

