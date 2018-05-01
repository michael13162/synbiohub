
import pug from 'pug';
import sparql from '../../sparql/sparql';
import jobUtils from '../../jobs/job-utils';
import db from '../../db';
import config from '../../config';

export default async function(req, res) {

    let jobs = await db.model.Job.findAll({
        include: [
            { model: db.model.User },
            { model: db.model.Task }
        ]
    })

    var locals = {
        config: config.get(),
        section: 'admin',
        adminSection: 'jobs',
        user: req.user,
        jobs: jobs
    }

    res.send(pug.renderFile('templates/views/admin/jobs.jade', locals))
};

