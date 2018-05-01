
import config from 'synbiohub/config';

export default function(req, res) {
    const remoteId = req.body.id
    var remotes = config.get('remotes')

    delete remotes[remoteId];

    config.set('remotes', remotes)
    res.redirect('/admin/remotes')
};
