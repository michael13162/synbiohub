
import pug from 'pug';
import jobUtils from '../jobs/job-utils';
import config from '../config';

export default async function(req, res) {

    let jobs = await jobUtils.listJobs(req.user)

    const statusToString = {
        [jobUtils.Status.QUEUED]: 'Queued',
        [jobUtils.Status.RUNNING]: 'Running',
        [jobUtils.Status.CANCELED]: 'Canceled',
        [jobUtils.Status.FINISHED]: 'Finished',
    }

    const statusToRowClass = {
        [jobUtils.Status.QUEUED]: 'warning',
        [jobUtils.Status.RUNNING]: 'info',
        [jobUtils.Status.CANCELED]: 'danger',
        [jobUtils.Status.FINISHED]: 'success',
    }

    const locals = {
        config: config.get(),
        section: 'jobs',
        user: req.user,
        jobs: jobs.sort((a, b) => b.createdAt - a.createdAt),
        Status: jobUtils.Status,
        statusToString: statusToString,
        statusToRowClass: statusToRowClass
    }
    
    res.send(pug.renderFile('templates/views/jobs.jade', locals))
};

