
import config from 'synbiohub/config';

export default function(req, res) {
    const uri = req.body.uri
    var registries = config.get('webOfRegistries')

    delete registries[uri];

    config.set('webOfRegistries', registries)
    res.redirect('/admin/registries')
};
