import config from '../config';
import pug from 'pug';


export default function(req, res) {

    if (req.method === 'POST'){

      submitPost(req, res)
    }

    else{

      submitForm(req, res, {}, {})

    }

};

function submitForm(req, res, submissionData, locals){

  var locals = {
        config: config.get(),
        section: 'component',
        user: req.user,
        errors: []
    }

  res.send(pug.renderFile('templates/views/createOrg.jade', locals))

}
