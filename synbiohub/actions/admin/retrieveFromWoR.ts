
import config from 'synbiohub/config';
import request from 'request-promise';

export default async function (req, res) {
    let worUrl = config.get('webOfRegistriesUrl');
    worUrl = worUrl[worUrl.length - 1] != "/" ? worUrl : worUrl.substring(0, worUrl.length - 1);

    let body = await request.get(worUrl + "/instances/")

    let wor = config.get('webOfRegistries');
    let received = JSON.parse(body);

    received.forEach(registry => {
        wor[registry["uriPrefix"]] = registry["instanceUrl"];
    })

    config.set('webOfRegistries', wor);

    res.redirect('/admin/registries')
}
