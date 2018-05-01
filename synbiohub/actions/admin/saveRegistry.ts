
import config from 'synbiohub/config';
import extend from 'xtend';

export default function (req, res) {
    var registries = config.get('webOfRegistries')

    registries[req.body.uri] = req.body.url;

    config.set('webOfRegistries', registries)

    res.redirect('/admin/registries')
};