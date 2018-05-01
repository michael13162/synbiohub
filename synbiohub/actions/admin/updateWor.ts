import config from '../../config';
import request from 'request-promise';

export default async function () {

    let data:any = {
        administratorEmail: config.get('administratorEmail'),
        name: config.get('instanceName'),
        description: config.get('frontPageText')
    }
    
    let worUrl = config.get('webOfRegistriesUrl');
    let updateSecret = config.get('webOfRegistriesSecret');
    let id = config.get('webOfRegistriesId');

    if(!(worUrl && updateSecret && id)) 
        return

    data.updateSecret = updateSecret;

    let body = await request.patch(worUrl + "/instances/" + id + "/", {
        json: data
    })

    config.set('webOfRegistriesSecret', body["updateSecret"]);
};


