
import config from 'synbiohub/config';
import request from 'request-promise';

export default async function (req, res) {
    let data = {
        instanceUrl: config.get('instanceUrl'),
        uriPrefix: config.get('databasePrefix'),
        administratorEmail: req.body.administratorEmail,
        updateEndpoint: 'updateWebOfRegistries',
        name: config.get('instanceName'),
        description: config.get('frontPageText')
    }

    config.set('administratorEmail', req.body.administratorEmail);
    
    let worUrl = req.body.webOfRegistries[-1] != "/" ? req.body.webOfRegistries : req.body.webOfRegistries.substring(0, -1);

    let body = await request.post(worUrl + "/instances/new/", {
        json: data
    })

    config.set('webOfRegistriesSecret', body["updateSecret"]);
    config.set('webOfRegistriesUrl', worUrl);
    config.set('webOfRegistriesId', body["id"]);

    res.redirect('/admin/registries');
}
