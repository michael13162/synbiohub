
import config from 'synbiohub/config';
import updateWor from './updateWor';

export default function(req, res) {

    if(req.body.administratorEmail) {
        config.set("administratorEmail", req.body.administratorEmail);
        
        updateWor();

        res.redirect('/admin/registries');
    }
};

